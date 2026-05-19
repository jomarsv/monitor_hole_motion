export type OptimizationCandidate = {
  chipSurface: string;
  wavelengthNm: number;
  flowRateUlMin: number;
  score: number;
};

export function rankOptimizationCandidates(
  candidates: OptimizationCandidate[],
): OptimizationCandidate[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}
