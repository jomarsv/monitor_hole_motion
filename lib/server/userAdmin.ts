import "server-only";

import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminAuthClient, getAdminFirestore } from "@/lib/firebase/admin";
import type { CreateUserRequest, UserProfile } from "@/lib/types/auth";
import { getRoleConfig, roleCatalog } from "@/lib/types/hierarchy";

export async function createManagedUser(input: CreateUserRequest): Promise<UserProfile> {
  const auth = getAdminAuthClient();
  const db = getAdminFirestore();
  const roleConfig = roleCatalog[input.role];

  const userRecord = await auth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.displayName,
    emailVerified: false,
    disabled: false
  });

  const accessLevel = input.accessLevel ?? roleConfig.accessLevel;
  const dailyAnalysisLimit = input.dailyAnalysisLimit ?? roleConfig.dailyAnalysisLimit;

  await auth.setCustomUserClaims(userRecord.uid, {
    role: input.role,
    accessLevel,
    dailyAnalysisLimit
  });

  const profile: UserProfile = {
    uid: userRecord.uid,
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    accessLevel,
    dailyAnalysisLimit,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: input.department
  };

  await db.collection("users").doc(userRecord.uid).set({
    ...profile,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  return profile;
}

export async function bootstrapFirstAdmin(input: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<UserProfile> {
  const auth = getAdminAuthClient();
  const db = getAdminFirestore();
  const existing = await db.collection("users").limit(1).get();

  if (!existing.empty) {
    throw new Error("Bootstrap inicial indisponível depois que o primeiro usuário foi criado.");
  }

  const roleConfig = getRoleConfig("admin");

  await auth.setCustomUserClaims(input.uid, {
    role: roleConfig.role,
    accessLevel: roleConfig.accessLevel,
    dailyAnalysisLimit: roleConfig.dailyAnalysisLimit
  });

  const profile: UserProfile = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role: "admin",
    accessLevel: roleConfig.accessLevel,
    dailyAnalysisLimit: roleConfig.dailyAnalysisLimit,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection("users").doc(input.uid).set({
    ...profile,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  return profile;
}

export async function listManagedUsers(): Promise<UserProfile[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
    const data = doc.data() as UserProfile;
    return {
      ...data,
      uid: doc.id,
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString()
    };
  });
}

export async function updateManagedUser(
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const auth = getAdminAuthClient();
  const db = getAdminFirestore();
  const existing = await db.collection("users").doc(uid).get();

  if (!existing.exists) {
    throw new Error("Usuário não encontrado.");
  }

  const current = existing.data() as UserProfile;
  const nextRole = updates.role ?? current.role;
  const roleConfig = roleCatalog[nextRole];
  const nextProfile: UserProfile = {
    ...current,
    ...updates,
    uid,
    role: nextRole,
    accessLevel: updates.accessLevel ?? roleConfig.accessLevel,
    dailyAnalysisLimit: updates.dailyAnalysisLimit ?? roleConfig.dailyAnalysisLimit,
    updatedAt: new Date().toISOString()
  };

  await auth.setCustomUserClaims(uid, {
    role: nextProfile.role,
    accessLevel: nextProfile.accessLevel,
    dailyAnalysisLimit: nextProfile.dailyAnalysisLimit
  });

  await db.collection("users").doc(uid).set(
    {
      ...nextProfile,
      updatedAt: Timestamp.now()
    },
    { merge: true }
  );

  return nextProfile;
}

export async function updateManagedUserDailyLimit(uid: string, dailyAnalysisLimit: number): Promise<UserProfile> {
  return updateManagedUser(uid, { dailyAnalysisLimit });
}

export async function deleteManagedUser(uid: string): Promise<void> {
  const auth = getAdminAuthClient();
  const db = getAdminFirestore();

  await Promise.allSettled([
    db.collection("users").doc(uid).delete(),
    auth.deleteUser(uid)
  ]);
}
