import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/database/drizzle";
import { subjects, teacherSubjects } from "@/database/schema";
import { and, eq } from "drizzle-orm";

type AuthedUser = {
  id: string;
  role: "admin" | "teacher";
  departmentId: number;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthedUser;

  const { subjectId } = (await req.json()) as { subjectId?: number };

  if (!subjectId) {
    return NextResponse.json(
      { error: "subjectId is required" },
      { status: 400 }
    );
  }

  // Verify subject belongs to this admin's department
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

  // Delete mapping(s)
  await db
    .delete(teacherSubjects)
    .where(eq(teacherSubjects.subjectId, subjectId));

  return NextResponse.json({ success: true });
}
