import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken, getTokenRole } from "@/lib/server/auth";
import {
  canAccessAudit,
  extractAuditRequestContext,
  getAllowedClientAuditEventTypes,
  listAuditEvents,
  recordAuditEvent
} from "@/lib/server/audit";

export const runtime = "nodejs";

function normalizeLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.min(200, Math.max(1, Math.floor(parsed)));
}

async function requireAuditAccess(request: Request) {
  const user = await requireVerifiedUser(await extractBearerToken(request.headers));
  const role = getTokenRole(user.tokenClaims) || user.profile.role;

  if (!canAccessAudit(role)) {
    throw new Error("Acesso negado.");
  }

  return user;
}

export async function GET(request: Request) {
  try {
    await requireAuditAccess(request);
    const limit = normalizeLimit(new URL(request.url).searchParams.get("limit"));
    const events = await listAuditEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autorizado.";
    const status = message.includes("Acesso negado") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    const body = (await request.json().catch(() => null)) as
      | { eventType?: string; context?: Record<string, unknown> }
      | null;

    const eventType = body?.eventType;
    const allowedTypes = getAllowedClientAuditEventTypes();
    if (!eventType || !allowedTypes.includes(eventType as "sign_in" | "sign_out")) {
      return NextResponse.json({ error: "Tipo de auditoria inválido." }, { status: 400 });
    }

    const event = await recordAuditEvent({
      eventType: eventType as "sign_in" | "sign_out",
      actor: {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName,
        role: user.profile.role,
        accessLevel: user.profile.accessLevel
      },
      context: {
        source: "client",
        route: "/entrar",
        ...extractAuditRequestContext(request.headers),
        ...(body?.context ?? {})
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel registrar a auditoria.";
    const status = message.includes("Acesso negado") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
