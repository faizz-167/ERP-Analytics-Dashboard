import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/database/drizzle";
import { subjects, users, teacherSubjects } from "@/database/schema";
import { and, eq } from "drizzle-orm";

type AuthedUser = {
  id: string;
  role: "admin" | "teacher";
  departmentId: number;
  email?: string | null;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthedUser;

  const { subjectId, teacherId } = (await req.json()) as {
    subjectId?: number;
    teacherId?: number;
  };

  if (!subjectId || !teacherId) {
    return NextResponse.json(
      { error: "subjectId and teacherId are required" },
      { status: 400 }
    );
  }

  // Verify subject belongs to admin's department
  const [subjectRow] = await db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.id, subjectId),
        eq(subjects.departmentId, user.departmentId)
      )
    );

  if (!subjectRow) {
    return NextResponse.json(
      { error: "Subject not found in your department" },
      { status: 404 }
    );
  }

  // Verify teacher in same department
  const [teacherRow] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, teacherId),
        eq(users.role, "teacher"),
        eq(users.departmentId, user.departmentId)
      )
    );

  if (!teacherRow) {
    return NextResponse.json(
      { error: "Teacher not found in your department" },
      { status: 404 }
    );
  }

  // Ensure only one teacher per subject: delete existing assignments for this subject
  await db
    .delete(teacherSubjects)
    .where(eq(teacherSubjects.subjectId, subjectId));

  // Insert new mapping
  await db.insert(teacherSubjects).values({
    teacherId,
    subjectId,
  });

  return NextResponse.json({ success: true });
}
