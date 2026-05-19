import { generateBaselineAngleSweep } from "@/lib/spr/angleSweep";

export default function SprSimulatorPage() {
  const preview = generateBaselineAngleSweep(63.5, 5);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Simulador SPR</h1>
      <p className="mt-4 leading-7 text-slate-700">
        Area inicial para simulacao de varreduras angulares MP-SPR/EC-SPR. Os
        valores abaixo sao pontos sinteticos de uma curva fisica simplificada,
        em graus e refletancia normalizada.
      </p>
      <pre className="mt-6 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-50">
        {JSON.stringify(preview, null, 2)}
      </pre>
    </main>
  );
}
