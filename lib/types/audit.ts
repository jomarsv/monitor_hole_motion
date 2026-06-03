import type { UserRole } from "./hierarchy";

export type AuditEventType =
  | "sign_in"
  | "sign_out"
  | "bootstrap_admin"
  | "question_submitted"
  | "question_blocked"
  | "analysis_generated";

export type AuditEventActor = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessLevel: number;
};

export type AuditEventContext = {
  source?: "client" | "server";
  route?: string;
  question?: string;
  requestedAgentId?: string | null;
  selectedAgentId?: string;
  selectedAgentName?: string;
  classificationTheme?: string;
  matchedKeywords?: string[];
  blockedReason?: string;
  analysisId?: string;
  quotaRemaining?: number;
  libraryItemCount?: number;
  status?: string;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
};

export type AuditEvent = {
  id: string;
  eventType: AuditEventType;
  createdAt: string;
  actor: AuditEventActor;
  context: AuditEventContext;
};

export type AuditEventInput = {
  eventType: AuditEventType;
  actor: AuditEventActor;
  context?: AuditEventContext;
  createdAt?: string;
};

