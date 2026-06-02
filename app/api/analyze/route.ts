import { NextResponse } from "next/server";
import { classifyQuestion } from "@/lib/agents/classifyQuestion";
import { getAgentById } from "@/lib/agents/agents";
import { generateStrategicAnalysis } from "@/lib/openai/client";
import { buildAnalysisPrompt } from "@/lib/prompts/buildAnalysisPrompt";
import { saveServerAnalysis } from "@/lib/server/analysis";
import { requireVerifiedUser, extractBearerToken, getTokenAccessLevel, getTokenRole } from "@/lib/server/auth";
import { consumeDailyAnalysisQuota } from "@/lib/server/quota";
import { listAccessibleLibraryItems } from "@/lib/server/library";
import type { Analysis, AnalyzeRequest, AnalyzeResponse } from "@/lib/types/analysis";
import { extractConfidenceLevel } from "@/lib/utils/confidence";
import { validateQuestion } from "@/lib/utils/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AnalyzeRequest | null;
  const validation = validateQuestion(body?.question);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const token = await extractBearerToken(request.headers);

  try {
    const user = await requireVerifiedUser(token);
    const classification = classifyQuestion(validation.value);
    const selectedAgent = getAgentById(body?.agentId) ?? classification.recommendedAgent;

    const quota = await consumeDailyAnalysisQuota(user.profile);
    const libraryContext = await listAccessibleLibraryItems({
      question: validation.value,
      accessLevel: getTokenAccessLevel(user.tokenClaims) || user.profile.accessLevel,
      maxItems: 8
    });

    const now = new Date().toISOString();
    const analysisId = crypto.randomUUID();

    const prompt = buildAnalysisPrompt({
      question: validation.value,
      agent: selectedAgent,
      classification,
      user: {
        displayName: user.profile.displayName,
        email: user.profile.email,
        role: getTokenRole(user.tokenClaims),
        accessLevel: user.profile.accessLevel
      },
      libraryContext
    });

    const answer = await generateStrategicAnalysis({
      systemPrompt: selectedAgent.systemPrompt,
      userPrompt: prompt
    });

    const analysis: Analysis = {
      id: analysisId,
      userId: user.uid,
      userEmail: user.profile.email,
      userDisplayName: user.profile.displayName,
      userRole: user.profile.role,
      userAccessLevel: user.profile.accessLevel,
      question: validation.value,
      selectedAgentId: selectedAgent.id,
      selectedAgentName: selectedAgent.name,
      autoClassifiedTheme: classification.theme,
      classificationReason: classification.reason,
      status: "completed",
      answer,
      confidenceLevel: extractConfidenceLevel(answer),
      libraryItemIds: libraryContext.map((item) => item.id),
      libraryItemSummaries: libraryContext.map((item) => ({
        id: item.id,
        title: item.title,
        accessLevel: item.accessLevel,
        summary: item.summary
      })),
      createdAt: now,
      updatedAt: now
    };

    await saveServerAnalysis(analysis);

    const response: AnalyzeResponse = {
      analysis,
      classification,
      persisted: true,
      user: {
        uid: user.uid,
        email: user.profile.email,
        displayName: user.profile.displayName,
        role: user.profile.role,
        accessLevel: user.profile.accessLevel
      }
    };

    return NextResponse.json({
      ...response,
      quotaRemaining: quota.remaining
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel gerar a analise estrategica.";
    const status =
      message.includes("Nao autenticado") || message.includes("Perfil de usuario") || message.includes("Conta desativada")
        ? 401
        : message.includes("Limite diario")
          ? 429
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
