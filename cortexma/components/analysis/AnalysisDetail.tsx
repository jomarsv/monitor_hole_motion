"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Analysis } from "@/lib/types/analysis";
import { fetchJson } from "@/lib/utils/api";

export function AnalysisDetail({ analysisId }: { analysisId: string }) {
  const { profile, idToken, loading } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState("Carregando analise...");

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      if (!profile || !idToken) {
        if (!active) {
          return;
        }

        setAnalysis(null);
        setStatus("Entre com seu usuario para ver esta analise.");
        return;
      }

      try {
        const remote = await fetchJson<{ analysis: Analysis }>(`/api/analyses/${analysisId}`, idToken);

        if (!active) {
          return;
        }

        setAnalysis(remote.analysis);
        setStatus("Analise carregada com sucesso.");
      } catch {
        if (!active) {
          return;
        }

        setAnalysis(null);
        setStatus("Nao foi possivel carregar esta analise autenticada.");
      }
    }

    if (!loading) {
      loadAnalysis();
    }

    return () => {
      active = false;
    };
  }, [analysisId, idToken, loading, profile]);

  if (!analysis) {
    return (
      <section className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
          Resultado
        </p>
        <h1 className="mt-2 text-2xl font-bold text-cortex-ink">{status}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          O historico e protegido por autenticacao. Consulte com o mesmo usuario que gerou a analise.
        </p>
        <Link
          href="/nova-analise"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-cortex-forest px-4 py-2 text-sm font-bold text-white"
        >
          Criar nova analise
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">{status}</p>
      <AnalysisResult analysis={analysis} />
    </div>
  );
}
