import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { extractAuditRequestContext, recordAuditEvent } from "@/lib/server/audit";
import { deleteAnalysesForUser } from "@/lib/server/analysis";
import { deleteManagedUser, updateManagedUserDailyLimit } from "@/lib/server/userAdmin";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const user = await requireVerifiedUser(await extractBearerToken(request.headers));

  if (user.profile.role !== "admin") {
    throw new Error("Acesso negado.");
  }

  return user;
}

export async function PATCH(request: Request, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await requireAdmin(request);
    const { uid } = await context.params;
    const body = (await request.json().catch(() => null)) as { dailyAnalysisLimit?: unknown } | null;

    const dailyAnalysisLimit = Number(body?.dailyAnalysisLimit);
    if (!Number.isFinite(dailyAnalysisLimit) || dailyAnalysisLimit < 1) {
      return NextResponse.json({ error: "Limite diário inválido." }, { status: 400 });
    }

    const profile = await updateManagedUserDailyLimit(uid, Math.floor(dailyAnalysisLimit));

    await recordAuditEvent({
      eventType: "user_updated",
      actor: {
        uid: actor.uid,
        email: actor.profile.email,
        displayName: actor.profile.displayName,
        role: actor.profile.role,
        accessLevel: actor.profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/admin/users/[uid]",
        ...extractAuditRequestContext(request.headers),
        status: "daily_limit_updated",
        selectedAgentName: profile.displayName,
        analysisId: uid,
        quotaRemaining: profile.dailyAnalysisLimit
      }
    }).catch(() => null);

    return NextResponse.json({ user: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o usuário.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await requireAdmin(request);
    const { uid } = await context.params;

    if (uid === actor.uid) {
      return NextResponse.json({ error: "Não é possível excluir a própria conta." }, { status: 400 });
    }

    await deleteAnalysesForUser(uid);
    await deleteManagedUser(uid);

    await recordAuditEvent({
      eventType: "user_deleted",
      actor: {
        uid: actor.uid,
        email: actor.profile.email,
        displayName: actor.profile.displayName,
        role: actor.profile.role,
        accessLevel: actor.profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/admin/users/[uid]",
        ...extractAuditRequestContext(request.headers),
        status: "user_deleted",
        selectedAgentName: uid
      }
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir o usuário.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
