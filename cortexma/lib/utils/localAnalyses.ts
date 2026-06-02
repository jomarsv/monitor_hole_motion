import type { Analysis } from "@/lib/types/analysis";

const STORAGE_KEY = "cortexma:analyses";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readLocalAnalyses(): Analysis[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Analysis[];
  } catch {
    return [];
  }
}

export function saveLocalAnalysis(analysis: Analysis): void {
  if (!canUseStorage()) {
    return;
  }

  const analyses = readLocalAnalyses();
  const nextAnalyses = [
    analysis,
    ...analyses.filter((item) => item.id !== analysis.id)
  ].slice(0, 30);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnalyses));
}

export function findLocalAnalysis(id: string): Analysis | null {
  return readLocalAnalyses().find((analysis) => analysis.id === id) ?? null;
}
