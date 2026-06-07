"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchJson } from "@/lib/utils/api";

export function AgentProposalForm() {
  const { profile, idToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!profile || !idToken) {
      setError("Entre com seu usuário para propor um novo agente.");
      return;
    }

    try {
      setBusy(true);
      const response = await fetchJson<{ proposal: { id: string } }>("/api/agent-proposals", idToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          focusAreas,
          systemPrompt
        })
      });

      setName("");
      setDescription("");
      setFocusAreas("");
      setSystemPrompt("");
      setMessage(`Proposta enviada para validação. Protocolo: ${response.proposal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a proposta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
        Propor agente
      </p>
      <h2 className="mt-2 text-2xl font-bold text-cortex-ink">Sugerir um novo agente</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        Qualquer usuário autenticado pode propor um novo especialista. A adição só entra no
        catálogo após validação de administrador ou gestor.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-cortex-ink">
          Nome do agente
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            placeholder="Ex.: Agente de Saúde e Bem-Estar"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink">
          Áreas de foco
          <input
            value={focusAreas}
            onChange={(event) => setFocusAreas(event.target.value)}
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            placeholder="Separadas por vírgula"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
          Descrição
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-sm"
            placeholder="Explique o papel do agente e os tipos de análise que ele deve produzir."
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
          Prompt do agente
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            className="min-h-36 rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-sm"
            placeholder="Instruções que vão orientar o comportamento do agente."
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 lg:col-span-2">
            {message}
          </p>
        ) : null}

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Enviando..." : "Enviar proposta"}
          </button>
        </div>
      </form>
    </section>
  );
}

