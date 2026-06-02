import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Analysis } from "@/lib/types/analysis";

const COLLECTION_NAME = "analyses";

export async function saveServerAnalysis(analysis: Analysis): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION_NAME).doc(analysis.id).set({
    ...analysis,
    createdAt: Timestamp.fromDate(new Date(analysis.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(analysis.updatedAt))
  });
}

export async function updateServerAnalysis(
  id: string,
  updates: Partial<Analysis>
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION_NAME).doc(id).set(
    {
      ...updates,
      updatedAt: Timestamp.now()
    },
    { merge: true }
  );
}

export async function listAnalysesForUser(uid: string, role: string): Promise<Analysis[]> {
  const db = getAdminFirestore();
  const query =
    role === "admin"
      ? db.collection(COLLECTION_NAME).orderBy("createdAt", "desc").limit(50)
      : db.collection(COLLECTION_NAME).where("userId", "==", uid).limit(50);

  const snapshot = await query.get();

  const analyses = snapshot.docs.map((doc) => {
    const data = doc.data() as Analysis;
    return {
      ...data,
      id: doc.id,
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString()
    };
  });

  return analyses.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function getAnalysisForUser(
  uid: string,
  role: string,
  id: string
): Promise<Analysis | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Analysis;

  if (role !== "admin" && data.userId !== uid) {
    return null;
  }

  return {
    ...data,
    id: snapshot.id,
    createdAt:
      typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString()
  };
}
