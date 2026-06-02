import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types/auth";
import type { UserRole } from "@/lib/types/hierarchy";
import { getRoleConfig } from "@/lib/types/hierarchy";

const COLLECTION_NAME = "users";

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase nao configurado.");
  }
}

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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getDoc(doc(db, COLLECTION_NAME, uid));

  if (!snapshot.exists()) {
    return null;
  }

  return mapUserSnapshot(snapshot as QueryDocumentSnapshot<DocumentData>);
}

export async function listUsers(): Promise<UserProfile[]> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")));

  return snapshot.docs.map(mapUserSnapshot);
}

export async function listUsersLimited(maxItems = 100): Promise<UserProfile[]> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getDocs(
    query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"), limit(maxItems))
  );

  return snapshot.docs.map(mapUserSnapshot);
}

export async function countUsers(): Promise<number> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getCountFromServer(collection(db, COLLECTION_NAME));
  return snapshot.data().count;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const ref = doc(db, COLLECTION_NAME, profile.uid);

  await setDoc(
    ref,
    {
      ...profile,
      createdAt: profile.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const ref = doc(db, COLLECTION_NAME, uid);

  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function listUsersByRole(role: UserRole): Promise<UserProfile[]> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), where("role", "==", role)));
  return snapshot.docs.map(mapUserSnapshot);
}
