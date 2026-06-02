import { NextResponse } from "next/server";
import { classifyQuestion } from "@/lib/agents/classifyQuestion";
import { validateQuestion } from "@/lib/utils/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const validation = validateQuestion(body?.question);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const classification = classifyQuestion(validation.value);

  return NextResponse.json({
    theme: classification.theme,
    recommendedAgent: classification.recommendedAgent,
    reason: classification.reason,
    matchedKeywords: classification.matchedKeywords
  });
}
