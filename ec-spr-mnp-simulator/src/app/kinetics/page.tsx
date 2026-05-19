import { KineticsClient } from "@/components/kinetics/KineticsClient";

export default function KineticsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Modelo Langmuir simplificado
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Cinetica de associacao/dissociacao
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Sensorgrama sintetico por dGamma/dt = ka*C*(GammaMax - Gamma) -
          kd*Gamma, com fases de baseline, associacao, lavagem/dissociacao e
          regeneracao opcional.
        </p>
        <div className="mt-8">
          <KineticsClient />
        </div>
      </div>
    </main>
  );
}
