"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Analysis } from "@/lib/types/analysis";
import { fetchJson } from "@/lib/utils/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AnalysisHistoryList() {
  const { profile, idToken, loading } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [status, setStatus] = useState("Carregando historico...");

  useEffect(() => {
    let active = true;

    async function loadAnalyses() {
      if (!profile || !idToken) {
        if (!active) {
          return;
        }

        setAnalyses([]);
        setStatus("Entre com seu usuario para ver o historico.");
        return;
      }

      try {
        const remote = await fetchJson<{ analyses: Analysis[] }>("/api/analyses", idToken);

        if (!active) {
          return;
        }

        setAnalyses(remote.analyses);
        setStatus(remote.analyses.length ? "Historico carregado com sucesso." : "Nenhuma analise encontrada.");
      } catch {
        if (!active) {
          return;
        }

        setAnalyses([]);
        setStatus("Nao foi possivel carregar o historico autenticado.");
      }
    }

    if (!loading) {
      loadAnalyses();
    }

    return () => {
      active = false;
    };
  }, [idToken, loading, profile]);

  return (
    <section className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 border-b border-cortex-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
            Historico
          </p>
          <h1 className="mt-2 text-2xl font-bold text-cortex-ink">Analises estrategicas</h1>
        </div>
        <p className="text-sm text-neutral-600">{status}</p>
      </div>

      <div className="mt-5 divide-y divide-cortex-line">
        {analyses.length === 0 ? (
          <div className="flex items-start gap-3 py-6 text-neutral-700">
            <span className="mt-1 font-bold text-cortex-gold" aria-hidden="true">
              !
            </span>
            <p className="text-sm leading-6">
              As analises geradas aparecerao aqui depois do login e da geracao pelo usuario autenticado.
            </p>
          </div>
        ) : null}

        {analyses.map((analysis) => (
          <Link
            key={analysis.id}
            href={`/analises/${analysis.id}`}
            className="group flex flex-col gap-3 py-5 transition hover:bg-cortex-cloud sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-bold text-cortex-ink">
                {analysis.question}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                {analysis.selectedAgentName} • {formatDate(analysis.updatedAt)}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-cortex-forest">
              Ver resultado
              <span className="transition group-hover:translate-x-1" aria-hidden="true">
                -&gt;
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
