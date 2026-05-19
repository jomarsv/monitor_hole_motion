import { SprSimulatorClient } from "@/components/spr/SprSimulatorClient";

export default function SimulatorPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Modelo multicamada Fresnel · luz p-polarizada
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Simulador SPR angular
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Simulacao Kretschmann para arquiteturas BioNavis MP-SPR Navi 210A
          VASA. Microplasticos e nanoplasticos sao tratados aqui como camada
          efetiva equivalente, nao como particulas individuais.
        </p>
        <div className="mt-8">
          <SprSimulatorClient />
        </div>
      </div>
    </main>
  );
}
