import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken, getTokenAccessLevel, getTokenRole } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireVerifiedUser(await extractBearerToken(request.headers));

    return NextResponse.json({
      uid: user.uid,
      email: user.profile.email,
      displayName: user.profile.displayName,
      role: getTokenRole(user.tokenClaims) || user.profile.role,
      accessLevel: getTokenAccessLevel(user.tokenClaims) || user.profile.accessLevel,
      dailyAnalysisLimit: user.profile.dailyAnalysisLimit,
      dailyUsageDate: user.profile.dailyUsageDate,
      dailyUsageCount: user.profile.dailyUsageCount ?? 0,
      active: user.profile.active,
      department: user.profile.department ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autenticado.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
