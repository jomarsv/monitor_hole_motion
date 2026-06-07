import { NextResponse } from "next/server";
import { classifyQuestion } from "@/lib/agents/classifyQuestion";
import { listActiveAgents } from "@/lib/server/agentCatalog";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { validateQuestion } from "@/lib/utils/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  const validation = validateQuestion(body?.question);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  try {
    await requireVerifiedUser(await extractBearerToken(request.headers));
    const agents = await listActiveAgents();
    const classification = classifyQuestion(validation.value, agents);
    return NextResponse.json(classification);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autenticado.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
