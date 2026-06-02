import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { listAnalysesForUser } from "@/lib/server/analysis";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    const analyses = await listAnalysesForUser(user.uid, user.profile.role);
    return NextResponse.json({ analyses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autenticado.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
