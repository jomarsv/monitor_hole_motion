import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAiClassificationForTest } from "@/lib/ai/alertDecision";
import type { AiAlertDecision, AiAlertDecisionInput } from "@/lib/ai/alertDecisionTypes";

describe("ai alert decision", () => {
  it("forces walking posture when heuristic indicates caminhada", () => {
    const input: AiAlertDecisionInput = {
      deviceId: "holy-motion-001",
      timestamp: 1,
      localSeverity: "normal",
      localAlertIds: [],
      metrics: {
        sustainedTilt: false,
        relativeInactivity: false,
        sampleCount: 120,
        maxTiltDegrees: 8,
      },
      heuristicClassification: {
        posture: "andando",
        activity: "caminhada",
        confidence: 0.9,
        rationale: "Heuristica local detectou caminhada.",
      },
      recentWindow: {
        sampleCount: 120,
        durationMs: 8000,
        accelerationMagnitude: { mean: 1.06, max: 1.28 },
        angularVelocityMagnitude: { mean: 24, max: 52 },
        tiltDegrees: { mean: 7, max: 12 },
        verticalAcceleration: { mean: 0.97, max: 1.2 },
        horizontalAcceleration: { mean: 0.18, max: 0.34 },
        motionBursts: 9,
      },
    };

    const decision: AiAlertDecision = {
      configured: true,
      shouldAlert: false,
      severity: "normal",
      confidence: 0.61,
      posture: "sentado",
      activity: "movimento-leve",
      title: "Analise IA",
      message: "Sem alerta",
      rationale: "Resposta original do modelo.",
    };

    const normalized = normalizeAiClassificationForTest(decision, input);

    assert.equal(normalized.posture, "andando");
    assert.equal(normalized.activity, "caminhada");
    assert.ok(normalized.rationale.includes("heuristica local de caminhada"));
  });
});
