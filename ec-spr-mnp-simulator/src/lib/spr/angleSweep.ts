import { bioNavisNavi210aVasaPreset } from "@/config/instrumentPresets";

export type AngleSweepPoint = {
  angleDegrees: number;
  reflectance: number;
};

export function generateBaselineAngleSweep(
  resonanceAngleDegrees = 63.5,
  points = 160,
): AngleSweepPoint[] {
  const { min, max } = bioNavisNavi210aVasaPreset.angularRangeDegrees;
  const step = (max - min) / Math.max(points - 1, 1);

  return Array.from({ length: points }, (_, index) => {
    const angleDegrees = min + step * index;
    const dip = Math.exp(-((angleDegrees - resonanceAngleDegrees) ** 2) / 1.8);
    const baseline = 0.82 + 0.0025 * (angleDegrees - min);

    return {
      angleDegrees: Number(angleDegrees.toFixed(3)),
      reflectance: Number(Math.max(0.04, baseline - 0.68 * dip).toFixed(5)),
    };
  });
}
