import { SprCompareClient } from "@/components/spr/SprCompareClient";

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Comparador SPR
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Comparacao de arquiteturas
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Curvas simuladas para comparar deslocamentos angulares relativos entre
          Au nu, camadas funcionais e camada efetiva de PS.
        </p>
        <div className="mt-8">
          <SprCompareClient />
        </div>
      </div>
    </main>
  );
}
