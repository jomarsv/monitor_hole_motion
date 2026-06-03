import "server-only";

import { type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { UserProfile } from "@/lib/types/auth";
import { getRoleConfig } from "@/lib/types/hierarchy";

const COLLECTION_NAME = "users";

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

function mapUserSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = snapshot.data();

  return {
    uid: snapshot.id,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? data.email ?? ""),
    role: data.role ?? "viewer",
    accessLevel: Number(data.accessLevel ?? getRoleConfig("viewer").accessLevel),
    dailyAnalysisLimit: Number(
      data.dailyAnalysisLimit ?? getRoleConfig("viewer").dailyAnalysisLimit
    ),
    active: Boolean(data.active ?? true),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    lastLoginAt: data.lastLoginAt ? toIsoDate(data.lastLoginAt) : undefined,
    dailyUsageDate: data.dailyUsageDate ? String(data.dailyUsageDate) : undefined,
    dailyUsageCount:
      typeof data.dailyUsageCount === "number" ? data.dailyUsageCount : undefined,
    department: data.department ? String(data.department) : undefined
  };
}

export async function getServerUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return mapUserSnapshot(snapshot as QueryDocumentSnapshot<DocumentData>);
}
