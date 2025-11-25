// lib/academicContext.ts
import db from "@/database/drizzle";
import { auth } from "@/auth";
import { marks, attendance, students, subjects } from "@/database/schema";
import { eq, inArray, and, desc, SQL, sql } from "drizzle-orm";

/**
 * ------------------------------------------------------------------
 * 1. Smart Context (Detailed)
 * Fetches detailed rows for Marks and Attendance based on context.
 * Used for general questions like "How is John doing in CS101?"
 * ------------------------------------------------------------------
 */
export async function getSmartContext(userQuestion: string) {
  const session = await auth();
  const departmentId = session?.user?.departmentId;

  if (!departmentId) return null;

  const qRaw = userQuestion.toLowerCase();

  // 1. Fetch ONLY matching Subjects (Metadata)
  const matchedSubjects = await db
    .select({ id: subjects.id, code: subjects.code, name: subjects.name })
    .from(subjects)
    .where(
      and(
        eq(subjects.departmentId, departmentId),
        sql`(STRPOS(${qRaw}, LOWER(${subjects.code})) > 0 OR STRPOS(${qRaw}, LOWER(${subjects.name})) > 0)`
      )
    )
    .limit(5);

  // 2. Fetch ONLY matching Students (Metadata)
  const matchedStudents = await db
    .select({
      id: students.id,
      registerNumber: students.registerNumber,
      name: students.name,
    })
    .from(students)
    .where(
      and(
        eq(students.departmentId, departmentId),
        sql`(STRPOS(${qRaw}, LOWER(${students.registerNumber})) > 0 OR STRPOS(${qRaw}, LOWER(${students.name})) > 0)`
      )
    )
    .limit(5);

  const hasSubjectFilter = matchedSubjects.length > 0;
  const hasStudentFilter = matchedStudents.length > 0;

  // IDs to fetch
  const subjectIds = matchedSubjects.map((s) => s.id);
  const studentIds = matchedStudents.map((s) => s.id);

  console.log(
    `🔍 SmartContext Filter: subjects=${matchedSubjects.map(
      (s) => s.code
    )}, students=${matchedStudents.map((s) => s.name)}`
  );

  // 3. Build Dynamic Conditions for Marks
  const marksConditions: SQL[] = [eq(students.departmentId, departmentId)];

  if (hasSubjectFilter) {
    marksConditions.push(inArray(marks.subjectId, subjectIds));
  }
  if (hasStudentFilter) {
    marksConditions.push(inArray(marks.studentId, studentIds));
  }

  // 4. Marks Query
  const marksData = await db
    .select({
      studentName: students.name,
      studentRegisterNumber: students.registerNumber,
      subjectCode: subjects.code,
      subjectName: subjects.name,
      cat1: marks.cat1,
      cat2: marks.cat2,
      cat3: marks.cat3,
      semester: marks.semester,
    })
    .from(marks)
    .innerJoin(students, eq(marks.studentId, students.id))
    .innerJoin(subjects, eq(marks.subjectId, subjects.id))
    .where(and(...marksConditions))
    .limit(hasStudentFilter ? 50 : 20);

  // 5. Build Dynamic Conditions for Attendance
  const attendanceConditions: SQL[] = [eq(students.departmentId, departmentId)];

  if (hasSubjectFilter) {
    attendanceConditions.push(inArray(attendance.subjectId, subjectIds));
  }
  if (hasStudentFilter) {
    attendanceConditions.push(inArray(attendance.studentId, studentIds));
  }

  // 6. Attendance Query
  const attendanceData = await db
    .select({
      studentName: students.name,
      studentRegisterNumber: students.registerNumber,
      subjectCode: subjects.code,
      date: attendance.attendanceDate,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
    .where(and(...attendanceConditions))
    .orderBy(desc(attendance.attendanceDate))
    .limit(100);

  return {
    meta: {
      filterApplied:
        hasSubjectFilter || hasStudentFilter ? "Filtered" : "General/Recent",
      subjectsFound: matchedSubjects.map((s) => s.code),
      studentsFound: matchedStudents.map((s) => s.name),
    },
    marks: marksData,
    attendance: attendanceData,
  };
}

/**
 * ------------------------------------------------------------------
 * 2. Attendance Summary (Optimized)
 * Aggregates data to avoid sending thousands of rows to the LLM.
 * ------------------------------------------------------------------
 */
export async function getAttendanceSummary(userQuestion: string) {
  const session = await auth();
  const departmentId = session?.user?.departmentId;

  if (!departmentId) return null;

  const qRaw = userQuestion.toLowerCase();

  // 1. Check for Student Intent
  const matchedStudents = await db
    .select({
      id: students.id,
      name: students.name,
      registerNumber: students.registerNumber,
    })
    .from(students)
    .where(
      and(
        eq(students.departmentId, departmentId),
        sql`(STRPOS(${qRaw}, LOWER(${students.name})) > 0 OR STRPOS(${qRaw}, LOWER(${students.registerNumber})) > 0)`
      )
    )
    .limit(3);

  // 2. Check for Subject Intent
  const matchedSubjects = await db
    .select({ id: subjects.id, code: subjects.code, name: subjects.name })
    .from(subjects)
    .where(
      and(
        eq(subjects.departmentId, departmentId),
        sql`(STRPOS(${qRaw}, LOWER(${subjects.code})) > 0 OR STRPOS(${qRaw}, LOWER(${subjects.name})) > 0)`
      )
    )
    .limit(3);

  let mode: "student" | "subject" | "department" = "department";
  if (matchedStudents.length > 0) mode = "student";
  else if (matchedSubjects.length > 0) mode = "subject";

  // Helper: Calculate percentages
  const calculateStats = (rows: { status: string | null }[]) => {
    let total = 0;
    let present = 0;
    rows.forEach((r) => {
      total++;
      if (r.status === "Present") present++;
    });
    return {
      total,
      present,
      absent: total - present,
      rate: total > 0 ? ((present / total) * 100).toFixed(1) + "%" : "0%",
    };
  };

  // --- MODE: DEPARTMENT (Overall) ---
  if (mode === "department") {
    const limit = 1000;
    const rows = await db
      .select({ status: attendance.status })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(students.departmentId, departmentId))
      .orderBy(desc(attendance.attendanceDate))
      .limit(limit);

    const stats = calculateStats(rows);

    return {
      kind: "department",
      message: "Overall Department Attendance",
      sampleSize: rows.length, // REFINEMENT: Explicit sample size
      isSampled: rows.length === limit,
      stats,
    };
  }

  // --- MODE: SUBJECT ---
  if (mode === "subject") {
    const subjectIds = matchedSubjects.map((s) => s.id);

    const rows = await db
      .select({
        subjectCode: subjects.code,
        subjectName: subjects.name,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
      .where(
        and(
          inArray(attendance.subjectId, subjectIds),
          eq(subjects.departmentId, departmentId)
        )
      );

    type SubjectStat = { name: string; total: number; present: number };
    const grouped: Record<string, SubjectStat> = {};

    rows.forEach((curr) => {
      const key = curr.subjectCode;
      if (!grouped[key]) {
        grouped[key] = { name: curr.subjectName, total: 0, present: 0 };
      }
      grouped[key].total++;
      if (curr.status === "Present") grouped[key].present++;
    });

    return {
      kind: "subject",
      subjects: Object.entries(grouped).map(([code, val]) => ({
        code,
        name: val.name,
        stats: {
          total: val.total,
          present: val.present,
          rate:
            val.total > 0
              ? ((val.present / val.total) * 100).toFixed(1) + "%"
              : "0%",
        },
      })),
    };
  }

  // --- MODE: STUDENT ---
  const studentIds = matchedStudents.map((s) => s.id);

  const rows = await db
    .select({
      studentId: attendance.studentId,
      studentName: students.name,
      studentReg: students.registerNumber, // REFINEMENT: Fetch Reg Number
      subjectCode: subjects.code,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
    .where(inArray(attendance.studentId, studentIds));

  // REFINEMENT: Group by ID to handle same-name students
  type StudentStat = {
    name: string;
    registerNumber: string;
    total: number;
    present: number;
    subjects: Record<string, { total: number; present: number }>;
  };

  // Key = Student ID (String or Number)
  const grouped: Record<string, StudentStat> = {};

  rows.forEach((curr) => {
    const key = String(curr.studentId); // Safe key

    if (!grouped[key]) {
      grouped[key] = {
        name: curr.studentName,
        registerNumber: curr.studentReg,
        total: 0,
        present: 0,
        subjects: {},
      };
    }

    // Overall Student Stats
    grouped[key].total++;
    if (curr.status === "Present") grouped[key].present++;

    // Per Subject Stats
    if (!grouped[key].subjects[curr.subjectCode]) {
      grouped[key].subjects[curr.subjectCode] = { total: 0, present: 0 };
    }
    grouped[key].subjects[curr.subjectCode].total++;
    if (curr.status === "Present")
      grouped[key].subjects[curr.subjectCode].present++;
  });

  return {
    kind: "student",
    students: Object.values(grouped).map((val) => ({
      // Object.values because key is ID now
      name: val.name,
      registerNumber: val.registerNumber,
      overallRate:
        val.total > 0
          ? ((val.present / val.total) * 100).toFixed(1) + "%"
          : "0%",
      breakdown: Object.entries(val.subjects).map(([sub, sVal]) => ({
        subject: sub,
        rate:
          sVal.total > 0
            ? ((sVal.present / sVal.total) * 100).toFixed(1) + "%"
            : "0%",
      })),
    })),
  };
}
