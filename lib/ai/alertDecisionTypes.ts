import type { MotionAnalysis } from "@/lib/monitoring/motionAnalysis";
import type { RemoteBehaviorProfile } from "@/lib/monitoring/remoteTypes";

export type AiAlertDecisionSeverity = "normal" | "attention" | "critical";

export type AiAlertDecisionInput = {
  deviceId: string;
  timestamp: number;
  localSeverity: MotionAnalysis["severity"];
  localAlertIds: string[];
  metrics: MotionAnalysis["metrics"];
  behaviorProfile?: RemoteBehaviorProfile;
  recentWindow: {
    sampleCount: number;
    durationMs: number;
    accelerationMagnitude: WindowStats;
    angularVelocityMagnitude: WindowStats;
    tiltDegrees: WindowStats;
  };
};

export type AiAlertDecision = {
  configured: boolean;
  shouldAlert: boolean;
  severity: AiAlertDecisionSeverity;
  confidence: number;
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
