import Link from "next/link";
import { AnalysisDetail } from "@/components/analysis/AnalysisDetail";
import { requirePageSession } from "@/lib/server/auth";

type AnalysisPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  await requirePageSession();
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/analises"
        className="inline-flex items-center gap-2 text-sm font-bold text-cortex-forest"
      >
        <span aria-hidden="true">&lt;-</span>
        Voltar ao historico
      </Link>
      <AnalysisDetail analysisId={id} />
    </div>
  );
}
