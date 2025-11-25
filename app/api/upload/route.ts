// app/api/upload-attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { auth } from "@/auth";
import db from "@/database/drizzle";
// IMPORTS UPDATED: Added attendance, students, subjects schema
import {
  attendanceUploads,
  attendance,
  students,
  subjects,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync"; // You need: npm install csv-parse

export const runtime = "nodejs";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

type UserSession = {
  id: string;
  role: string;
  departmentId: number;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

// Define Expected CSV Structure
type AttendanceCSVRow = {
  register_number: string; // CSV Header name
  subject_code: string; // CSV Header name
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent";
};

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as UserSession;

  if (!containerName || !connectionString) {
    return NextResponse.json(
      { error: "Storage config missing" },
      { status: 500 }
    );
  }

  try {
    // 1. Read form-data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 }
      );
    }

    // 2. Convert Blob → Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // ---------------------------------------------------------
    // 3. UPLOAD TO AZURE BLOB STORAGE
    // ---------------------------------------------------------
    const originalFileName = (file as File).name?.trim() || "attendance.csv";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blobName = `teacher-${
      user.email ?? "unknown"
    }/${timestamp}-${originalFileName}`;

    const blobService =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobService.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    await blobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: "text/csv" },
      metadata: {
        teacherEmail: user.email ?? "",
        uploadedAt: new Date().toISOString(),
      },
    });

    // ---------------------------------------------------------
    // 4. PREPARE FOR DB INGESTION (Lookup Maps)
    // ---------------------------------------------------------
    // Fetch all students & subjects for this department to create lookup maps.
    // This avoids running a DB query for every single row in the CSV.

    const [deptStudents, deptSubjects] = await Promise.all([
      db
        .select({ id: students.id, reg: students.registerNumber })
        .from(students)
        .where(eq(students.departmentId, user.departmentId)),

      db
        .select({ id: subjects.id, code: subjects.code })
        .from(subjects)
        .where(eq(subjects.departmentId, user.departmentId)),
    ]);

    // Create Maps for O(1) Lookup
    const studentMap = new Map(
      deptStudents.map((s) => [s.reg.toLowerCase(), s.id])
    );
    const subjectMap = new Map(
      deptSubjects.map((s) => [s.code.toLowerCase(), s.id])
    );

    // ---------------------------------------------------------
    // 5. PARSE CSV DATA
    // ---------------------------------------------------------
    const records = parse(fileBuffer, {
      columns: true, // Auto-detect headers
      skip_empty_lines: true,
      trim: true,
    }) as AttendanceCSVRow[];

    const validRowsToInsert: (typeof attendance.$inferInsert)[] = [];
    const errors: string[] = [];

    // ---------------------------------------------------------
    // 6. VALIDATE & MAP ROWS
    // ---------------------------------------------------------
    for (const [index, row] of records.entries()) {
      const rowIndex = index + 2; // +1 for 0-index, +1 for header row

      // CSV keys must match these exactly, or update them to match your CSV headers
      const regNo = row.register_number?.toLowerCase();
      const subCode = row.subject_code?.toLowerCase();
      const dateStr = row.date;
      const status = row.status; // "Present" or "Absent"

      if (!regNo || !subCode || !dateStr || !status) {
        errors.push(`Row ${rowIndex}: Missing required fields`);
        continue;
      }

      const studentId = studentMap.get(regNo);
      const subjectId = subjectMap.get(subCode);

      if (!studentId) {
        errors.push(
          `Row ${rowIndex}: Student '${row.register_number}' not found in your department`
        );
        continue;
      }
      if (!subjectId) {
        errors.push(
          `Row ${rowIndex}: Subject '${row.subject_code}' not found in your department`
        );
        continue;
      }

      // Add to bulk insert array
      validRowsToInsert.push({
        studentId,
        subjectId,
        attendanceDate: dateStr, // Ensure YYYY-MM-DD format in CSV
        status: status as "Present" | "Absent",
      });
    }

    // ---------------------------------------------------------
    // 7. BULK INSERT TO DB
    // ---------------------------------------------------------
    if (validRowsToInsert.length > 0) {
      await db
        .insert(attendance)
        .values(validRowsToInsert)
        // PostgreSQL: Update status if record exists for same Student+Subject+Date
        .onConflictDoUpdate({
          target: [
            attendance.studentId,
            attendance.subjectId,
            attendance.attendanceDate,
          ],
          set: { status: sql`excluded.status` },
        });
    }

    // ---------------------------------------------------------
    // 8. LOG UPLOAD HISTORY
    // ---------------------------------------------------------
    const finalStatus =
      errors.length > 0 && validRowsToInsert.length === 0
        ? "failed"
        : "uploaded";

    await db.insert(attendanceUploads).values({
      userId: Number(user.id),
      departmentId: user.departmentId,
      blobName,
      originalFileName,
      status: finalStatus,
      error:
        errors.length > 0
          ? errors.slice(0, 3).join("; ") + (errors.length > 3 ? "..." : "")
          : null,
    });

    if (finalStatus === "failed") {
      return NextResponse.json(
        {
          error: "Data validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      blobName,
      insertedCount: validRowsToInsert.length,
      warnings: errors,
      message: `Processed ${validRowsToInsert.length} records successfully.`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper needed for onConflictDoUpdate
import { sql } from "drizzle-orm";
