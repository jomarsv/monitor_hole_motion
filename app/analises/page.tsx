import Link from "next/link";
import { AnalysisHistoryList } from "@/components/analysis/AnalysisHistoryList";
import { requirePageSession } from "@/lib/server/auth";

export default async function AnalysesPage() {
  await requirePageSession();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
            CortexMA
          </p>
          <h1 className="mt-2 text-3xl font-bold text-cortex-ink">Historico de analises</h1>
        </div>
        <Link
          href="/nova-analise"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cortex-forest px-4 py-2 text-sm font-bold text-white transition hover:bg-cortex-leaf"
        >
          Nova analise
        </Link>
      </div>

      <AnalysisHistoryList />
    </div>
  );
}
