import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { extractAuditRequestContext, recordAuditEvent } from "@/lib/server/audit";
import { reviewAgentProposal } from "@/lib/server/agentCatalog";

export const runtime = "nodejs";

function isReviewer(role: string): boolean {
  return role === "admin" || role === "manager";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    if (!isReviewer(user.profile.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | { decision?: string; reviewNote?: string }
      | null;

    const decision = body?.decision === "approved" ? "approved" : body?.decision === "rejected" ? "rejected" : null;
    if (!decision) {
      return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
    }

    const proposal = await reviewAgentProposal(
      id,
      decision,
      {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName
      },
      body?.reviewNote
    );

    if (!proposal) {
      return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    }

    await recordAuditEvent({
      eventType: decision === "approved" ? "agent_approved" : "agent_rejected",
      actor: {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName,
        role: user.profile.role,
        accessLevel: user.profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/agent-proposals/[id]",
        ...extractAuditRequestContext(request.headers),
        status: decision === "approved" ? "agent_approved" : "agent_rejected",
        selectedAgentId: proposal.id,
        selectedAgentName: proposal.name,
        blockedReason: body?.reviewNote
      }
    }).catch(() => null);

    return NextResponse.json({ proposal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível revisar a proposta.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
