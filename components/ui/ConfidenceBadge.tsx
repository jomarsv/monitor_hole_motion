import type { ConfidenceLevel } from "@/lib/types/analysis";

const labels: Record<ConfidenceLevel, string> = {
  baixo: "Confianca baixa",
  medio: "Confianca media",
  alto: "Confianca alta"
};

const classes: Record<ConfidenceLevel, string> = {
  baixo: "border-amber-300 bg-amber-50 text-amber-800",
  medio: "border-sky-300 bg-sky-50 text-sky-800",
  alto: "border-emerald-300 bg-emerald-50 text-emerald-800"
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${classes[level]}`}
    >
      {labels[level]}
    </span>
  );
}
