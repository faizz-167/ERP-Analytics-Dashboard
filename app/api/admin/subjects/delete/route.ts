import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/database/drizzle";
import { subjects } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subjectId } = body;

  if (!subjectId) {
    return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
  }

  await db.delete(subjects).where(eq(subjects.id, subjectId));

  return NextResponse.json({ success: true });
}
