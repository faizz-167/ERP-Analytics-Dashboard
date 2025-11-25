// app/api/academic-assistant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { azureClient, getModelName } from "@/lib/azureClient";
import { getSmartContext, getAttendanceSummary } from "@/lib/academicContext";

export const runtime = "nodejs";

function isPureAttendanceQuestion(q: string): boolean {
  const text = q.toLowerCase();

  const attendanceKeywords = [
    "attendance",
    "present",
    "absent",
    "absentee",
    "absenteeism",
    "regularity",
    "punctuality",
    "classes attended",
    "missed classes",
  ];

  const hasAttendanceKeywords = attendanceKeywords.some((keyword) =>
    text.includes(keyword)
  );

  const hasAcademicKeywords =
    text.includes("mark") ||
    text.includes("grade") ||
    text.includes("score") ||
    text.includes("result") ||
    text.includes("fail") ||
    text.includes("pass") ||
    text.includes("performance");

  if (hasAcademicKeywords) return false;

  return hasAttendanceKeywords;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const model = getModelName();
    const isAttendanceOnly = isPureAttendanceQuestion(question);

    // ---------------------------------------------------------
    // 1️⃣ Branch: ATTENDANCE ONLY
    // ---------------------------------------------------------
    if (isAttendanceOnly) {
      const summary = await getAttendanceSummary(question);

      if (!summary) {
        return NextResponse.json(
          { error: "No context available." },
          { status: 403 }
        );
      }

      const prompt = `
[SYSTEM INSTRUCTION]
You are an AI Academic Assistant.
Answer using ONLY the provided JSON summary below.
If the data is for a specific student, ALWAYS mention their Register Number.
If the data is empty, say "I couldn't find attendance records for that query."
Keep it professional and concise.

[USER QUESTION]
${question}

[DATA CONTEXT]
${JSON.stringify(summary, null, 2)}
      `.trim();

      const response = await azureClient.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        // Reasoning models need high limits for thinking tokens
        max_completion_tokens: 5000,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === "content_filter") {
        return NextResponse.json({
          answer:
            "⚠️ Response was blocked by Azure's content safety filter (PII detected).",
        });
      }

      return NextResponse.json({
        answer: choice.message?.content || "No response generated.",
      });
    }

    // ---------------------------------------------------------
    // 2️⃣ Branch: GENERAL ACADEMIC (Marks + Attendance)
    // ---------------------------------------------------------
    const context = await getSmartContext(question);

    if (!context) {
      return NextResponse.json(
        { error: "No academic context available" },
        { status: 403 }
      );
    }

    const contextString = JSON.stringify(context);

    const prompt = `
[SYSTEM INSTRUCTION]
You are an AI Academic Assistant.
Analyze the provided JSON data to answer the user's question.
- If looking for "at-risk" or "weak" students, identify those with low marks (< 50%) OR low attendance (< 75%).
- Explicitly mention Student Name and Register Number.
- If data is missing for a specific student/subject, explicitly say so.
- Do not hallucinate data not present in the JSON.

[USER QUESTION]
${question}

[DATA CONTEXT]
${contextString}
    `.trim();

    const response = await azureClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      // FIX: Increased from 2000 to 12000 to accommodate "Hidden Chain of Thought"
      max_completion_tokens: 12000,
    });

    const choice = response.choices[0];
    console.log(
      "🔍 Azure Response (SmartContext):",
      JSON.stringify(choice, null, 2)
    );

    // Handle Content Filters
    if (choice.finish_reason === "content_filter") {
      return NextResponse.json({
        answer: "⚠️ Response was blocked by Azure's content safety filter.",
      });
    }

    // Handle Token Exhaustion (Length)
    if (choice.finish_reason === "length") {
      // If content is empty, the model spent all tokens thinking and output nothing.
      if (!choice.message?.content) {
        return NextResponse.json({
          answer:
            "⚠️ The AI thought for too long and timed out. Please try a simpler question.",
        });
      }
      // If content exists but is cut off
      return NextResponse.json({
        answer:
          choice.message.content +
          "\n\n(⚠️ Response truncated due to length limit)",
      });
    }

    const answer =
      choice.message?.content || "No response generated (Empty Content).";
    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("❌ AI Processing Error:", err);

    if (err?.message?.includes("temperature")) {
      return NextResponse.json(
        {
          error:
            "Model config error: 'temperature' is not supported for this model.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
