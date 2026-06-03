import { NextResponse } from "next/server";
import { classifyQuestion } from "@/lib/agents/classifyQuestion";
import { validateQuestion } from "@/lib/utils/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  const validation = validateQuestion(body?.question);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const classification = classifyQuestion(validation.value);
  return NextResponse.json(classification);
}
