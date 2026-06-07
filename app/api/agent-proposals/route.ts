import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { extractAuditRequestContext, recordAuditEvent } from "@/lib/server/audit";
import {
  createAgentProposal,
  listPendingAgentProposals
} from "@/lib/server/agentCatalog";
import type { CreateAgentProposalRequest } from "@/lib/types/agentProposal";

export const runtime = "nodejs";

function isReviewer(role: string): boolean {
  return role === "admin" || role === "manager";
}

function parseFocusAreas(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    if (!isReviewer(user.profile.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const proposals = await listPendingAgentProposals();
    return NextResponse.json({ proposals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autorizado.";
    const status = message.includes("Acesso negado") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    const body = (await request.json().catch(() => null)) as Partial<CreateAgentProposalRequest> | null;

    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const systemPrompt = String(body?.systemPrompt ?? "").trim();
    const focusAreas = parseFocusAreas(body?.focusAreas);

    if (!name || !description || !systemPrompt || focusAreas.length === 0) {
      return NextResponse.json(
        { error: "Nome, descrição, áreas de foco e prompt são obrigatórios." },
        { status: 400 }
      );
    }

    const proposal = await createAgentProposal(
      {
        name,
        description,
        systemPrompt,
        focusAreas
      },
      {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName,
        role: user.profile.role
      }
    );

    await recordAuditEvent({
      eventType: "agent_proposed",
      actor: {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName,
        role: user.profile.role,
        accessLevel: user.profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/agent-proposals",
        ...extractAuditRequestContext(request.headers),
        status: "agent_proposed",
        selectedAgentId: proposal.id,
        selectedAgentName: proposal.name
      }
    }).catch(() => null);

    return NextResponse.json({ proposal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar a proposta.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
