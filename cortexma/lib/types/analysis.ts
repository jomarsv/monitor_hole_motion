import type { AgentClassification } from "./agent";
import type { LibraryItem } from "./library";
import type { UserProfile } from "./auth";

export type ConfidenceLevel = "baixo" | "medio" | "alto";

export type AnalysisStatus = "pending" | "completed" | "failed";

export type Analysis = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userRole: string;
  userAccessLevel: number;
  question: string;
  selectedAgentId: string;
  selectedAgentName: string;
  autoClassifiedTheme: string;
  classificationReason?: string;
  status: AnalysisStatus;
  answer: string;
  confidenceLevel: ConfidenceLevel;
  libraryItemIds?: string[];
  libraryItemSummaries?: Array<Pick<LibraryItem, "id" | "title" | "accessLevel" | "summary">>;
  createdAt: string;
  updatedAt: string;
};

export type AnalyzeRequest = {
  question: string;
  agentId?: string | null;
};

export type AnalyzeResponse = {
  analysis: Analysis;
  classification: AgentClassification;
  persisted: boolean;
  persistenceError?: string;
  user?: Pick<UserProfile, "uid" | "email" | "displayName" | "role" | "accessLevel">;
  quotaRemaining?: number;
};
