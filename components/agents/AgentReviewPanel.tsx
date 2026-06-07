"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchJson } from "@/lib/utils/api";
import type { AgentProposal } from "@/lib/types/agentProposal";

type ResponseShape = {
  proposals: AgentProposal[];
};

type BusyMap = Record<string, "approve" | "reject" | null>;

export function AgentReviewPanel() {
  const { profile, idToken } = useAuth();
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [busy, setBusy] = useState<BusyMap>({});
  const [status, setStatus] = useState("Carregando propostas...");
  const [error, setError] = useState("");

  const canReview = profile?.role === "admin" || profile?.role === "manager";

  async function loadProposals(token = idToken) {
    if (!token) return;

    const response = await fetchJson<ResponseShape>("/api/agent-proposals", token);
    setProposals(response.proposals);
    setStatus(response.proposals.length ? "Propostas pendentes carregadas." : "Sem propostas pendentes.");
  }

  useEffect(() => {
    if (canReview && idToken) {
      loadProposals().catch(() => {
        setProposals([]);
        setStatus("Não foi possível carregar as propostas.");
      });
    }
  }, [canReview, idToken]);

  function setBusyAction(id: string, action: "approve" | "reject" | null) {
    setBusy((current) => ({
      ...current,
      [id]: action
    }));
  }

  async function reviewProposal(id: string, decision: "approved" | "rejected") {
    if (!idToken) {
      setError("Entre novamente para validar a proposta.");
      return;
    }

    try {
      setError("");
      setBusyAction(id, decision === "approved" ? "approve" : "reject");
      const response = await fetch(`/api/agent-proposals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ decision })
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível revisar a proposta.");
      }

      await loadProposals(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao revisar a proposta.");
    } finally {
      setBusyAction(id, null);
    }
  }

  if (!canReview) {
    return null;
  }

  return (
    <section className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 border-b border-cortex-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
            Validação
          </p>
          <h2 className="mt-2 text-2xl font-bold text-cortex-ink">Propostas de novos agentes</h2>
        </div>
        <p className="text-sm text-neutral-600">{status}</p>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {proposals.length === 0 ? (
          <p className="text-sm leading-6 text-neutral-700">
            Nenhuma proposta pendente no momento.
          </p>
        ) : null}

        {proposals.map((proposal) => (
          <article key={proposal.id} className="rounded-lg border border-cortex-line bg-cortex-cloud/40 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cortex-forest">
                  Protocolo {proposal.id}
                </p>
                <h3 className="text-lg font-bold text-cortex-ink">{proposal.name}</h3>
                <p className="text-sm leading-6 text-neutral-700">{proposal.description}</p>
                <p className="text-xs text-neutral-600">
                  Proposto por {proposal.submittedByDisplayName} • {proposal.submittedByEmail}
                </p>
                <div className="flex flex-wrap gap-2">
                  {proposal.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-lg border border-cortex-line bg-white px-2.5 py-1 text-xs font-semibold text-cortex-ink"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => reviewProposal(proposal.id, "approved")}
                  disabled={busy[proposal.id] === "approve"}
                  className="inline-flex min-h-10 items-center rounded-lg bg-cortex-forest px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy[proposal.id] === "approve" ? "Aprovando..." : "Aprovar"}
                </button>
                <button
                  type="button"
                  onClick={() => reviewProposal(proposal.id, "rejected")}
                  disabled={busy[proposal.id] === "reject"}
                  className="inline-flex min-h-10 items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy[proposal.id] === "reject" ? "Rejeitando..." : "Rejeitar"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
