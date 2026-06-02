import "server-only";

import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import type { LibraryItem } from "@/lib/types/library";

const COLLECTION_NAME = "libraryItems";

type LibrarySearchInput = {
  question: string;
  accessLevel: number;
  maxItems?: number;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenizeQuestion(question: string): string[] {
  return normalizeText(question)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function scoreItem(questionTokens: string[], item: LibraryItem): number {
  const haystack = normalizeText(
    [item.title, item.description, item.summary, item.excerpt ?? "", item.tags.join(" ")].join(" ")
  );

  return questionTokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

function sanitizeFileName(fileName: string): string {
  return fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "arquivo";
}

export async function listAccessibleLibraryItems({
  question,
  accessLevel,
  maxItems = 8
}: LibrarySearchInput): Promise<LibraryItem[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where("accessLevel", "<=", accessLevel)
    .orderBy("accessLevel", "desc")
    .limit(100)
    .get();

  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LibraryItem));
  const tokens = tokenizeQuestion(question);

  return items
    .map((item) => ({ item, score: scoreItem(tokens, item) }))
    .filter(({ score }) => score > 0 || tokens.length === 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItems)
    .map(({ item }) => item);
}

export async function createLibraryItem(input: {
  title: string;
  description: string;
  tags: string[];
  accessLevel: number;
  ownerUid: string;
  ownerName: string;
  fileName: string;
  contentType: string;
  storageBuffer: Buffer;
  summary: string;
  excerpt?: string;
  byteSize: number;
}): Promise<LibraryItem> {
  const db = getAdminFirestore();
  const bucket = getAdminStorage().bucket();
  const id = crypto.randomUUID();
  const safeFileName = sanitizeFileName(input.fileName);
  const storagePath = `library/${input.accessLevel}/${input.ownerUid}/${id}/${safeFileName}`;
  const file = bucket.file(storagePath);

  await file.save(input.storageBuffer, {
    metadata: {
      contentType: input.contentType,
      cacheControl: "private, max-age=0, no-store"
    },
    resumable: false
  });

  const now = new Date().toISOString();
  const item: LibraryItem = {
    id,
    title: input.title,
    description: input.description,
    tags: input.tags,
    accessLevel: input.accessLevel,
    ownerUid: input.ownerUid,
    ownerName: input.ownerName,
    fileName: input.fileName,
    contentType: input.contentType,
    storagePath,
    summary: input.summary,
    excerpt: input.excerpt,
    byteSize: input.byteSize,
    createdAt: now,
    updatedAt: now
  };

  await db.collection(COLLECTION_NAME).doc(id).set(item);

  return item;
}

export async function listLibraryItemsByOwner(ownerUid: string): Promise<LibraryItem[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where("ownerUid", "==", ownerUid)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LibraryItem));
}

export async function getSignedLibraryUrl(item: LibraryItem): Promise<string> {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(item.storagePath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24
  });
  return url;
}
