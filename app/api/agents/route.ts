import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { listActiveAgents } from "@/lib/server/agentCatalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireVerifiedUser(await extractBearerToken(request.headers));
    const agents = await listActiveAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autenticado.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

