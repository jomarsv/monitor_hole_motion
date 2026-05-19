import { estimateLangmuirResponseRiu } from "@/lib/kinetics/langmuir";

export default function KineticsPage() {
  const responseRiu = estimateLangmuirResponseRiu({
    concentrationUgMl: 5,
    associationRatePerUgMlSecond: 0.0004,
    dissociationRatePerSecond: 0.001,
    maxResponseRiu: 0.004,
    timeSeconds: 180,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Cinetica</h1>
      <p className="mt-4 leading-7 text-slate-700">
        Modelo inicial de Langmuir para explorar respostas simuladas em RIU com
        concentracao em µg/mL. Exemplo de resposta simulada: {responseRiu} RIU.
      </p>
    </main>
  );
}
