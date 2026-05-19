import { OptimizerClient } from "@/components/ai/OptimizerClient";

export default function OptimizerPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Dados sinteticos · ranking deterministico
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          IA/Otimizacao de arquiteturas
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Ranking inicial baseado em curvas SPR sinteticas: maior deslocamento
          angular para o alvo, menor resposta para controle/interferente e maior
          razao sinal/controle. Isto nao e um modelo treinado em dados
          experimentais.
        </p>
        <div className="mt-8">
          <OptimizerClient />
        </div>
      </div>
    </main>
  );
}
