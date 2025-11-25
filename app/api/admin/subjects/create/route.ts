import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/database/drizzle";
import { subjects } from "@/database/schema";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, code, semester, departmentId } = body;

  if (!name || !code || !semester || !departmentId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db.insert(subjects).values({
    name,
    code,
    semester,
    departmentId,
  });

  return NextResponse.json({ success: true });
}
