import { getAiAlertDecision } from "@/lib/ai/alertDecision";
import type { AiAlertDecisionInput } from "@/lib/ai/alertDecisionTypes";

export const runtime = "nodejs";

const MIN_REQUEST_INTERVAL_MS = 15000;
const lastRequestByDevice = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as AiAlertDecisionInput;
    const expectedDeviceId =
      process.env.NEXT_PUBLIC_REMOTE_DEVICE_ID ?? "holy-motion-001";

    if (input.deviceId !== expectedDeviceId) {
      return Response.json(
        {
          configured: Boolean(process.env.OPENAI_API_KEY),
          shouldAlert: false,
          severity: "normal",
          confidence: 0,
          title: "Dispositivo nao autorizado",
          message: "A analise IA aceitou apenas o dispositivo configurado.",
          rationale: "DeviceId divergente da configuracao do servidor.",
        },
        { status: 403 },
      );
    }

    const now = Date.now();
    const lastRequestAt = lastRequestByDevice.get(input.deviceId) ?? 0;

    if (now - lastRequestAt < MIN_REQUEST_INTERVAL_MS) {
      return Response.json({
        configured: Boolean(process.env.OPENAI_API_KEY),
        shouldAlert: false,
        severity: "normal",
        confidence: 0,
        title: "Analise IA limitada",
        message: "Aguarde a proxima janela de analise.",
        rationale: "Rate limit local para reduzir custo e chamadas repetidas.",
      });
    }

    lastRequestByDevice.set(input.deviceId, now);

    const decision = await getAiAlertDecision(input);

    return Response.json(decision);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        configured: Boolean(process.env.OPENAI_API_KEY),
        shouldAlert: false,
        severity: "normal",
        confidence: 0,
        title: "Falha na analise IA",
        message,
        rationale: "A analise local foi mantida como fonte primaria.",
      },
      { status: 200 },
    );
  }
}
