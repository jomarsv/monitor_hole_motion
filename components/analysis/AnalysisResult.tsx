import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import type { Analysis } from "@/lib/types/analysis";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function splitAnswer(answer: string) {
  const sections = answer
    .split(/\n(?=##\s+\d+\.)/g)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return [{ title: "Analise", body: answer }];
  }

  return sections.map((section) => {
    const [rawTitle, ...body] = section.split("\n");
    return {
      title: rawTitle.replace(/^##\s*/, ""),
      body: body.join("\n").trim()
    };
  });
}

export function AnalysisResult({ analysis }: { analysis: Analysis }) {
  const sections = splitAnswer(analysis.answer);

  return (
    <article className="space-y-6">
      <section className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
              Resultado da analise
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-cortex-ink">
              {analysis.question}
            </h1>
          </div>
          <ConfidenceBadge level={analysis.confidenceLevel} />
        </div>
        <div className="mt-5 grid gap-3 border-t border-cortex-line pt-5 text-sm text-neutral-700 md:grid-cols-3">
          <p>
            <span className="font-semibold text-cortex-ink">Agente:</span>{" "}
            {analysis.selectedAgentName}
          </p>
          <p>
            <span className="font-semibold text-cortex-ink">Tema:</span>{" "}
            {analysis.autoClassifiedTheme}
          </p>
          <p>
            <span className="font-semibold text-cortex-ink">Atualizado:</span>{" "}
            {formatDate(analysis.updatedAt)}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft"
          >
            <h2 className="text-lg font-bold text-cortex-ink">{section.title}</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {section.body}
            </div>
          </div>
        ))}
      </section>
    </article>
  );
}
