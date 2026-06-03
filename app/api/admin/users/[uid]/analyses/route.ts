import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { extractAuditRequestContext, recordAuditEvent } from "@/lib/server/audit";
import { deleteAnalysesForUser } from "@/lib/server/analysis";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const user = await requireVerifiedUser(await extractBearerToken(request.headers));

  if (user.profile.role !== "admin") {
    throw new Error("Acesso negado.");
  }

  return user;
}

export async function DELETE(request: Request, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await requireAdmin(request);
    const { uid } = await context.params;
    const deletedCount = await deleteAnalysesForUser(uid);

    await recordAuditEvent({
      eventType: "history_deleted",
      actor: {
        uid: actor.uid,
        email: actor.profile.email,
        displayName: actor.profile.displayName,
        role: actor.profile.role,
        accessLevel: actor.profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/admin/users/[uid]/analyses",
        ...extractAuditRequestContext(request.headers),
        status: "history_deleted",
        analysisId: uid,
        libraryItemCount: deletedCount
      }
    }).catch(() => null);

    return NextResponse.json({ ok: true, deletedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir o histórico.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
