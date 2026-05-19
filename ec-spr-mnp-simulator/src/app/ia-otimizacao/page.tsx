import { rankOptimizationCandidates } from "@/lib/ai/optimization";

export default function AiOptimizationPage() {
  const [bestCandidate] = rankOptimizationCandidates([
    {
      chipSurface: "Au funcionalizado",
      wavelengthNm: 670,
      flowRateUlMin: 25,
      score: 0.78,
    },
    { chipSurface: "Au liso", wavelengthNm: 670, flowRateUlMin: 15, score: 0.62 },
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">IA/Otimizacao</h1>
      <p className="mt-4 leading-7 text-slate-700">
        Area para predicao computacional e ranqueamento de condicoes de ensaio.
        Predicoes por IA devem ser tratadas como hipoteses, nao como dados
        experimentais. Melhor candidato simulado: {bestCandidate.chipSurface}.
      </p>
    </main>
  );
}
