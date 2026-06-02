import { QuestionForm } from "@/components/analysis/QuestionForm";
import { requirePageSession } from "@/lib/server/auth";

export default async function NewAnalysisPage() {
  await requirePageSession();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
          Nova analise estrategica
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-cortex-ink">
          Formule uma pergunta para o CortexMA
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-700">
          Informe um desafio, oportunidade ou cenario de desenvolvimento do Maranhao.
          O sistema pode escolher automaticamente o agente mais adequado.
        </p>
      </section>

      <QuestionForm />
    </div>
  );
}
