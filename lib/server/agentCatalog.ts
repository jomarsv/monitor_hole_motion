import "server-only";

import { randomUUID } from "crypto";
import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { agents as baseAgents } from "@/lib/agents/agents";
import type { Agent } from "@/lib/types/agent";
import type {
  AgentProposal,
  AgentProposalStatus,
  CreateAgentProposalRequest
} from "@/lib/types/agentProposal";
import type { UserProfile } from "@/lib/types/auth";

const COLLECTION_NAME = "agentProposals";

function toIsoDate(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapProposal(snapshot: QueryDocumentSnapshot<DocumentData>): AgentProposal {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas.map(String) : [],
    systemPrompt: String(data.systemPrompt ?? ""),
    status: (data.status ?? "pending") as AgentProposalStatus,
    submittedByUid: String(data.submittedByUid ?? ""),
    submittedByEmail: String(data.submittedByEmail ?? ""),
    submittedByDisplayName: String(data.submittedByDisplayName ?? data.submittedByEmail ?? ""),
    submittedByRole: (data.submittedByRole ?? "viewer") as UserProfile["role"],
    submittedAt: toIsoDate(data.submittedAt),
    reviewedByUid: data.reviewedByUid ? String(data.reviewedByUid) : undefined,
    reviewedByEmail: data.reviewedByEmail ? String(data.reviewedByEmail) : undefined,
    reviewedByDisplayName: data.reviewedByDisplayName
      ? String(data.reviewedByDisplayName)
      : undefined,
    reviewedAt: data.reviewedAt ? toIsoDate(data.reviewedAt) : undefined,
    reviewNote: data.reviewNote ? String(data.reviewNote) : undefined
  };
}

function toAgent(proposal: AgentProposal): Agent {
  return {
    id: proposal.id,
    name: proposal.name,
    description: proposal.description,
    focusAreas: proposal.focusAreas,
    systemPrompt: proposal.systemPrompt
  };
}

export function getBaseAgents(): Agent[] {
  return [...baseAgents];
}

export async function listActiveAgents(): Promise<Agent[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).where("status", "==", "approved").get();
  const customAgents = snapshot.docs.map((doc) => toAgent(mapProposal(doc)));
  return [...baseAgents, ...customAgents];
}

export async function listPendingAgentProposals(): Promise<AgentProposal[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).where("status", "==", "pending").get();

  return snapshot.docs.map((doc) => mapProposal(doc));
}

export async function listAgentProposalsForReview(): Promise<AgentProposal[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION_NAME).get();
  return snapshot.docs.map((doc) => mapProposal(doc));
}

export async function createAgentProposal(
  input: CreateAgentProposalRequest,
  actor: Pick<UserProfile, "uid" | "email" | "displayName" | "role">
): Promise<AgentProposal> {
  const db = getAdminFirestore();
  const id = randomUUID();
  const proposal: AgentProposal = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    focusAreas: input.focusAreas.map((item) => item.trim()).filter(Boolean),
    systemPrompt: input.systemPrompt.trim(),
    status: "pending",
    submittedByUid: actor.uid,
    submittedByEmail: actor.email,
    submittedByDisplayName: actor.displayName,
    submittedByRole: actor.role,
    submittedAt: new Date().toISOString()
  };

  await db.collection(COLLECTION_NAME).doc(id).set({
    ...proposal,
    submittedAt: Timestamp.now()
  });

  return proposal;
}

export async function reviewAgentProposal(
  proposalId: string,
  decision: "approved" | "rejected",
  reviewer: Pick<UserProfile, "uid" | "email" | "displayName">,
  reviewNote?: string
): Promise<AgentProposal | null> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION_NAME).doc(proposalId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  const current = mapProposal(snapshot as QueryDocumentSnapshot<DocumentData>);
  const next: AgentProposal = {
    ...current,
    status: decision,
    reviewedByUid: reviewer.uid,
    reviewedByEmail: reviewer.email,
    reviewedByDisplayName: reviewer.displayName,
    reviewedAt: new Date().toISOString(),
    reviewNote: reviewNote?.trim() || undefined
  };

  await ref.set(
    {
      ...next,
      reviewedAt: Timestamp.now()
    },
    { merge: true }
  );

  return next;
}
