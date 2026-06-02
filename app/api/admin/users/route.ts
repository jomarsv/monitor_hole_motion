import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken, getTokenRole } from "@/lib/server/auth";
import { createManagedUser, listManagedUsers } from "@/lib/server/userAdmin";
import type { CreateUserRequest } from "@/lib/types/auth";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const user = await requireVerifiedUser(await extractBearerToken(request.headers));
  const role = getTokenRole(user.tokenClaims) || user.profile.role;

  if (role !== "admin" && role !== "manager") {
    throw new Error("Acesso negado.");
  }

  return user;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const users = await listManagedUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autorizado.";
    const status = message.includes("Acesso negado") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json().catch(() => null)) as CreateUserRequest | null;

    if (!body?.email || !body.password || !body.displayName || !body.role) {
      return NextResponse.json({ error: "Campos obrigatorios ausentes." }, { status: 400 });
    }

    const profile = await createManagedUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      role: body.role,
      accessLevel: body.accessLevel,
      dailyAnalysisLimit: body.dailyAnalysisLimit,
      department: body.department
    });

    return NextResponse.json({ user: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar usuario.";
    const status = message.includes("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
