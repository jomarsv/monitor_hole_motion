import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthClient } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/firebase/userService";
import type { UserProfile } from "@/lib/types/auth";
import type { UserRole } from "@/lib/types/hierarchy";

const SESSION_COOKIE_NAME = "cortexma_session";

export type VerifiedRequestUser = {
  uid: string;
  email: string;
  displayName: string;
  profile: UserProfile;
  tokenClaims: Record<string, unknown>;
};

function getBearerTokenValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function extractBearerToken(
  requestHeaders?: Headers | Awaited<ReturnType<typeof headers>>
): Promise<string | null> {
  const currentHeaders = requestHeaders ?? (await headers());
  return getBearerTokenValue(currentHeaders.get("authorization"));
}

export async function verifyIdToken(token?: string | null) {
  const idToken = token ?? (await extractBearerToken());

  if (!idToken) {
    throw new Error("Nao autenticado.");
  }

  return getAdminAuthClient().verifyIdToken(idToken, true);
}

export async function requireVerifiedUser(token?: string | null): Promise<VerifiedRequestUser> {
  const decoded = await verifyIdToken(token);
  const profile = await getUserProfile(decoded.uid);

  if (!profile) {
    throw new Error("Perfil de usuario nao encontrado.");
  }

  if (!profile.active) {
    throw new Error("Conta desativada.");
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? profile.email,
    displayName: decoded.name ?? profile.displayName,
    profile,
    tokenClaims: decoded as unknown as Record<string, unknown>
  };
}

export async function requirePageSession(): Promise<VerifiedRequestUser> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/entrar");
  }

  const decoded = await getAdminAuthClient().verifySessionCookie(sessionCookie, true);
  const profile = await getUserProfile(decoded.uid);

  if (!profile || !profile.active) {
    redirect("/entrar");
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? profile.email,
    displayName: decoded.name ?? profile.displayName,
    profile,
    tokenClaims: decoded as unknown as Record<string, unknown>
  };
}

export function getTokenAccessLevel(tokenClaims: Record<string, unknown>): number {
  const value = tokenClaims.accessLevel;
  return typeof value === "number" ? value : 0;
}

export function getTokenRole(tokenClaims: Record<string, unknown>): UserRole {
  const value = tokenClaims.role;
  return value === "admin" || value === "manager" || value === "analyst" || value === "viewer"
    ? value
    : "viewer";
}
