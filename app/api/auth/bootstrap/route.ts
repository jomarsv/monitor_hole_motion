import { NextResponse } from "next/server";
import { verifyIdToken, extractBearerToken } from "@/lib/server/auth";
import { extractAuditRequestContext, recordAuditEvent } from "@/lib/server/audit";
import { bootstrapFirstAdmin } from "@/lib/server/userAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { displayName?: string; bootstrapKey?: string }
      | null;

    const bootstrapKey = process.env.CORTEXMA_BOOTSTRAP_SECRET;
    if (!bootstrapKey) {
      throw new Error("CORTEXMA_BOOTSTRAP_SECRET não configurado.");
    }

    if (body?.bootstrapKey !== bootstrapKey) {
      throw new Error("Chave de bootstrap invalida.");
    }

    const decoded = await verifyIdToken(await extractBearerToken(request.headers));
    const requestContext = extractAuditRequestContext(request.headers);

    const profile = await bootstrapFirstAdmin({
      uid: decoded.uid,
      email: decoded.email ?? decoded.uid,
      displayName: body?.displayName?.trim() || decoded.name || decoded.email || decoded.uid
    });

    await recordAuditEvent({
      eventType: "bootstrap_admin",
      actor: {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        accessLevel: profile.accessLevel
      },
      context: {
        source: "server",
        route: "/api/auth/bootstrap",
        ...requestContext
      }
    }).catch(() => null);

    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel concluir o bootstrap.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
