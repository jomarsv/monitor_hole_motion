"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingAnalysis } from "@/components/analysis/LoadingAnalysis";
import { agents } from "@/lib/agents/agents";
import { fetchJson } from "@/lib/utils/api";
import type { AgentClassification } from "@/lib/types/agent";
import type { AnalyzeResponse } from "@/lib/types/analysis";
import { saveLocalAnalysis } from "@/lib/utils/localAnalyses";
import { QUESTION_MAX_LENGTH } from "@/lib/utils/validation";

export function QuestionForm() {
  const router = useRouter();
  const { profile, idToken, loading: authLoading } = useAuth();
  const [question, setQuestion] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [classification, setClassification] = useState<AgentClassification | null>(null);
  const [error, setError] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function classifyCurrentQuestion() {
    setError("");
    setIsClassifying(true);

    try {
      const response = await fetch("/api/classify-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel classificar a pergunta.");
      }

      setClassification(data as AgentClassification);
      setSelectedAgentId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao classificar a pergunta.");
    } finally {
      setIsClassifying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!profile || !idToken) {
        throw new Error("Entre com seu usuario e senha para gerar analises.");
      }

      const data = await fetchJson<AnalyzeResponse>("/api/analyze", idToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          agentId: selectedAgentId || undefined
        })
      });
      saveLocalAnalysis(data.analysis);
      router.push(`/analises/${data.analysis.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar a analise.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const suggestedAgent = classification?.recommendedAgent;
  const effectiveAgentName = selectedAgent?.name ?? suggestedAgent?.name;
  const canSubmit = Boolean(profile?.active && idToken && !authLoading);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft"
      >
        <div>
          <label htmlFor="question" className="text-sm font-bold text-cortex-ink">
            Pergunta estrategica
          </label>
          <textarea
            id="question"
            value={question}
            maxLength={QUESTION_MAX_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ex.: Quais sao os principais gargalos para o desenvolvimento da Baixada Maranhense?"
            className="mt-2 min-h-44 w-full resize-y rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-base leading-7 outline-none transition focus:border-cortex-forest focus:bg-white focus:ring-2 focus:ring-cortex-leaf/20"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
            <span>{question.length}/{QUESTION_MAX_LENGTH} caracteres</span>
            <span>Evite dados pessoais e informacoes sigilosas.</span>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="agent" className="text-sm font-bold text-cortex-ink">
            Agente especializado opcional
          </label>
          <select
            id="agent"
            value={selectedAgentId}
            onChange={(event) => {
              setSelectedAgentId(event.target.value);
              setClassification(null);
            }}
            className="mt-2 h-12 w-full rounded-lg border border-cortex-line bg-white px-3 text-sm outline-none transition focus:border-cortex-forest focus:ring-2 focus:ring-cortex-leaf/20"
          >
            <option value="">Classificar automaticamente</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={classifyCurrentQuestion}
            disabled={isClassifying || isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cortex-line bg-white px-4 py-3 text-sm font-bold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClassifying ? "Classificando..." : "Sugerir agente"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isClassifying || !canSubmit}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white transition hover:bg-cortex-leaf disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Gerando analise..." : canSubmit ? "Gerar analise" : "Entre para analisar"}
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
            Agente selecionado
          </p>
          <h2 className="mt-2 text-xl font-bold text-cortex-ink">
            {effectiveAgentName ?? "Classificacao automatica"}
          </h2>
          {classification ? (
            <p className="mt-3 text-sm leading-6 text-neutral-700">{classification.reason}</p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Escolha um agente ou deixe o CortexMA identificar o tema pela pergunta.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
            Validacao humana
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            As respostas sao analises preliminares. Elas devem ser confrontadas com dados
            oficiais, estudos tecnicos e conhecimento territorial antes de orientar decisoes.
          </p>
        </div>

        {!profile ? (
          <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
              Acesso
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Entre com usuario e senha para gerar analises com biblioteca privada e limite diario.
            </p>
          </div>
        ) : null}

        {isSubmitting ? <LoadingAnalysis /> : null}
      </aside>
    </div>
  );
}
