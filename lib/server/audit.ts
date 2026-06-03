import "server-only";

import { randomUUID } from "crypto";
import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { AuditEvent, AuditEventContext, AuditEventInput, AuditEventType } from "@/lib/types/audit";
import type { UserRole } from "@/lib/types/hierarchy";

const COLLECTION_NAME = "auditEvents";
const AUDIT_ACCESS_ROLES: UserRole[] = ["admin", "manager"];
const CLIENT_EVENT_TYPES: AuditEventType[] = ["sign_in", "sign_out", "password_change"];

function toIsoDate(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function cleanContext(context?: AuditEventContext): AuditEventContext {
  if (!context) {
    return {};
  }

  return {
    ...context,
    matchedKeywords: Array.isArray(context.matchedKeywords)
      ? context.matchedKeywords.filter((keyword) => typeof keyword === "string")
      : undefined
  };
}

function mapAuditSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): AuditEvent {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    eventType: data.eventType as AuditEventType,
    createdAt: toIsoDate(data.createdAt),
    actor: {
      uid: String(data.actor?.uid ?? ""),
      email: String(data.actor?.email ?? ""),
      displayName: String(data.actor?.displayName ?? data.actor?.email ?? ""),
      role: (data.actor?.role ?? "viewer") as UserRole,
      accessLevel: Number(data.actor?.accessLevel ?? 0)
    },
    context: (data.context ?? {}) as AuditEventContext
  };
}

export function canAccessAudit(role: UserRole): boolean {
  return AUDIT_ACCESS_ROLES.includes(role);
}

export function getAllowedClientAuditEventTypes(): AuditEventType[] {
  return CLIENT_EVENT_TYPES;
}

export function extractAuditRequestContext(
  requestHeaders?: Headers
): Pick<AuditEventContext, "ipAddress" | "userAgent"> {
  if (!requestHeaders) {
    return {};
  }

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    undefined;

  return {
    ipAddress,
    userAgent: requestHeaders.get("user-agent") ?? undefined
  };
}

export async function recordAuditEvent(input: AuditEventInput): Promise<AuditEvent> {
  const db = getAdminFirestore();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = randomUUID();
  const event: AuditEvent = {
    id,
    eventType: input.eventType,
    createdAt,
    actor: input.actor,
    context: cleanContext(input.context)
  };

  await db.collection(COLLECTION_NAME).doc(id).set({
    ...event,
    createdAt: Timestamp.now()
  });

  return event;
}

export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).orderBy("createdAt", "desc").limit(limit).get();

  return snapshot.docs.map((doc) => mapAuditSnapshot(doc));
}
