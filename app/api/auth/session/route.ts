import { NextResponse } from "next/server";
import { getAdminAuthClient } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "cortexma_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function readRequestBody(request: Request): Promise<{ idToken?: string } | null> {
  return (await request.json().catch(() => null)) as { idToken?: string } | null;
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const idToken = body?.idToken?.trim();

    if (!idToken) {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    const sessionCookie = await getAdminAuthClient().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar a sessao.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
