import type {
  AiAlertDecision,
  AiAlertDecisionInput,
} from "@/lib/ai/alertDecisionTypes";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_AI_ALERT_MODEL = "gpt-4o-mini";

const alertDecisionSchema = {
  type: "object",
  properties: {
    shouldAlert: { type: "boolean" },
    severity: { type: "string", enum: ["normal", "attention", "critical"] },
    confidence: { type: "number" },
    posture: {
      type: "string",
      enum: [
        "em-pe",
        "deitado",
        "sentado",
        "andando",
        "parado",
        "transicao",
        "indefinido",
      ],
    },
    activity: {
      type: "string",
      enum: [
        "repouso",
        "movimento-leve",
        "caminhada",
        "mudanca-de-postura",
        "movimento-brusco",
        "indefinido",
      ],
    },
    title: { type: "string" },
    message: { type: "string" },
    rationale: { type: "string" },
  },
  required: [
    "shouldAlert",
    "severity",
    "confidence",
    "posture",
    "activity",
    "title",
    "message",
    "rationale",
  ],
  additionalProperties: false,
} as const;

export async function getAiAlertDecision(
  input: AiAlertDecisionInput,
): Promise<AiAlertDecision> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getUnconfiguredDecision();
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_ALERT_MODEL ?? DEFAULT_AI_ALERT_MODEL,
      input: [
        {
          role: "system",
          content:
            "Voce e uma camada auxiliar de decisao para monitoramento assistivo de movimento. Responda apenas pelo schema. Classifique a postura e a atividade atual do usuario com base nos sinais resumidos usando labels simples como em-pe, deitado, sentado, andando, parado ou transicao. Leve a classificacao heuristica recebida muito a serio como ancora fisica inicial, principalmente quando houver indicios de caminhada ou baixa inclinacao. Evite rotular como sentado se houver caminhada clara. Nao substitua regras deterministicas: quando o sinal for incerto, prefira normal ou attention, nunca critical. Critical deve ser usado apenas quando os dados indicarem risco claro por combinacao de impacto, baixa mobilidade, inclinacao ou desvio extremo do perfil aprendido. Isto nao e diagnostico medico.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "holy_motion_alert_decision",
          strict: true,
          schema: alertDecisionSchema,
        },
      },
      max_output_tokens: 350,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI alert decision failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractOutputText(payload);
  const parsed = JSON.parse(outputText) as Omit<AiAlertDecision, "configured">;

  return normalizeDecision({
    configured: true,
    shouldAlert: parsed.shouldAlert,
    severity: normalizeSeverity(parsed.severity, parsed.shouldAlert),
    confidence: clampConfidence(parsed.confidence),
    posture: parsed.posture ?? "indefinido",
    activity: parsed.activity ?? "indefinido",
    title: parsed.title || "Analise IA",
    message: parsed.message || "A IA sinalizou um padrao que merece revisao.",
    rationale: parsed.rationale || "Sem justificativa detalhada.",
  }, input);
}

function getUnconfiguredDecision(): AiAlertDecision {
  return {
    configured: false,
    shouldAlert: false,
    severity: "normal",
    confidence: 0,
    posture: "indefinido",
    activity: "indefinido",
    title: "IA nao configurada",
    message: "OPENAI_API_KEY nao foi configurada no servidor.",
    rationale: "Analise local mantida sem chamada a modelo externo.",
  };
}

function extractOutputText(payload: unknown): string {
  if (isRecord(payload) && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!isRecord(payload) || !Array.isArray(payload.output)) {
    throw new Error("OpenAI response did not include output text.");
  }

  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response text was empty.");
}

function normalizeSeverity(
  severity: AiAlertDecision["severity"],
  shouldAlert: boolean,
): AiAlertDecision["severity"] {
  if (!shouldAlert) {
    return "normal";
  }

  return severity === "critical" ? "critical" : "attention";
}

function clampConfidence(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(1, confidence));
}

function normalizeDecision(
  decision: AiAlertDecision,
  input: AiAlertDecisionInput,
): AiAlertDecision {
  const heuristic = input.heuristicClassification;

  if (heuristic.confidence < 0.65) {
    return decision;
  }

  if (
    heuristic.activity === "caminhada" &&
    (decision.posture === "sentado" || decision.posture === "parado")
  ) {
    return {
      ...decision,
      posture: "andando",
      activity: "caminhada",
      confidence: Math.max(decision.confidence, heuristic.confidence),
      rationale: `${decision.rationale} Ajustado por heuristica local de caminhada.`,
    };
  }

  if (
    heuristic.posture === "deitado" &&
    decision.posture !== "deitado" &&
    (input.metrics.maxTiltDegrees ?? 0) >= 70
  ) {
    return {
      ...decision,
      posture: "deitado",
      confidence: Math.max(decision.confidence, heuristic.confidence),
      rationale: `${decision.rationale} Ajustado por inclinacao sustentada compatível com decubito.`,
    };
  }

  return decision;
}

export function normalizeAiClassificationForTest(
  decision: AiAlertDecision,
  input: AiAlertDecisionInput,
) {
  return normalizeDecision(decision, input);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
