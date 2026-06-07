import type { Agent } from "./agent";
import type { UserRole } from "./hierarchy";

export type AgentProposalStatus = "pending" | "approved" | "rejected";

export type AgentProposal = Agent & {
  status: AgentProposalStatus;
  submittedByUid: string;
  submittedByEmail: string;
  submittedByDisplayName: string;
  submittedByRole: UserRole;
  submittedAt: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedByDisplayName?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type CreateAgentProposalRequest = Pick<
  Agent,
  "name" | "description" | "focusAreas" | "systemPrompt"
>;

