import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Analysis } from "@/lib/types/analysis";

const COLLECTION_NAME = "analyses";

type AnalysisWrite = Omit<Analysis, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

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

function mapAnalysisSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Analysis {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    userId: String(data.userId ?? ""),
    userEmail: String(data.userEmail ?? ""),
    userDisplayName: String(data.userDisplayName ?? ""),
    userRole: String(data.userRole ?? "viewer"),
    userAccessLevel: Number(data.userAccessLevel ?? 0),
    question: String(data.question ?? ""),
    selectedAgentId: String(data.selectedAgentId ?? ""),
    selectedAgentName: String(data.selectedAgentName ?? ""),
    autoClassifiedTheme: String(data.autoClassifiedTheme ?? ""),
    classificationReason: data.classificationReason
      ? String(data.classificationReason)
      : undefined,
    status: data.status ?? "completed",
    answer: String(data.answer ?? ""),
    confidenceLevel: data.confidenceLevel ?? "baixo",
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt)
  };
}

export async function createPendingAnalysis(analysis: AnalysisWrite): Promise<string> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const ref = analysis.id
    ? doc(db, COLLECTION_NAME, analysis.id)
    : doc(collection(db, COLLECTION_NAME));

  await setDoc(ref, {
    ...analysis,
    id: ref.id,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function saveAnalysis(analysis: Analysis): Promise<string> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const ref = doc(db, COLLECTION_NAME, analysis.id);

  await setDoc(ref, {
    ...analysis,
    createdAt: analysis.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateAnalysis(id: string, analysis: Partial<Analysis>): Promise<void> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const ref = doc(db, COLLECTION_NAME, id);

  await updateDoc(ref, {
    ...analysis,
    updatedAt: serverTimestamp()
  });
}

export async function listAnalyses(maxItems = 25): Promise<Analysis[]> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const analysesQuery = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(analysesQuery);

  return snapshot.docs.map(mapAnalysisSnapshot);
}

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  assertFirebaseConfigured();

  const db = getClientDb();
  const snapshot = await getDoc(doc(db, COLLECTION_NAME, id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapAnalysisSnapshot(snapshot);
}
