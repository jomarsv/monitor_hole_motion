import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken } from "@/lib/server/auth";
import { getAnalysisForUser } from "@/lib/server/analysis";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));
    const { id } = await context.params;
    const analysis = await getAnalysisForUser(user.uid, user.profile.role, id);

    if (!analysis) {
      return NextResponse.json({ error: "Analise nao encontrada." }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autenticado.";
    const status = message.includes("Analise nao encontrada") ? 404 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
