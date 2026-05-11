import type { MotionAnalysis } from "@/lib/monitoring/motionAnalysis";
import type { RemoteBehaviorProfile } from "@/lib/monitoring/remoteTypes";

export type AiAlertDecisionSeverity = "normal" | "attention" | "critical";
export type AiPostureLabel =
  | "em-pe"
  | "deitado"
  | "sentado"
  | "andando"
  | "parado"
  | "transicao"
  | "indefinido";
export type AiActivityLabel =
  | "repouso"
  | "movimento-leve"
  | "caminhada"
  | "mudanca-de-postura"
  | "movimento-brusco"
  | "indefinido";

export type AiAlertDecisionInput = {
  deviceId: string;
  timestamp: number;
  localSeverity: MotionAnalysis["severity"];
  localAlertIds: string[];
  metrics: MotionAnalysis["metrics"];
  behaviorProfile?: RemoteBehaviorProfile;
  heuristicClassification: {
    posture: AiPostureLabel;
    activity: AiActivityLabel;
    confidence: number;
    rationale: string;
  };
  recentWindow: {
    sampleCount: number;
    durationMs: number;
    accelerationMagnitude: WindowStats;
    angularVelocityMagnitude: WindowStats;
    tiltDegrees: WindowStats;
    verticalAcceleration: WindowStats;
    horizontalAcceleration: WindowStats;
    motionBursts: number;
  };
};

export type AiAlertDecision = {
  configured: boolean;
  shouldAlert: boolean;
  severity: AiAlertDecisionSeverity;
  confidence: number;
  posture: AiPostureLabel;
  activity: AiActivityLabel;
  title: string;
  message: string;
  rationale: string;
};

export type WindowStats = {
  min?: number;
  max?: number;
  mean?: number;
  latest?: number;
};
