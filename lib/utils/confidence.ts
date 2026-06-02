import type { ConfidenceLevel } from "@/lib/types/analysis";

export function extractConfidenceLevel(answer: string): ConfidenceLevel {
  const normalized = answer
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const confidenceSection = normalized.split("nivel de confianca da analise").at(-1) ?? normalized;

  if (confidenceSection.includes("alto")) {
    return "alto";
  }

  if (confidenceSection.includes("medio")) {
    return "medio";
  }

  return "baixo";
}
