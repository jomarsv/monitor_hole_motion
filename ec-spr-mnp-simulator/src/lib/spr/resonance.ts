import { bioNavisNavi210aVasaPreset } from "@/config/instrumentPresets";
import { calculatePPolarizedReflectance } from "./fresnel";
import type { SprLayer } from "./layers";

export type ReflectancePoint = {
  angleDegrees: number;
  reflectance: number;
};

export function generateAngularReflectanceCurve(
  layers: SprLayer[],
  options: {
    startDegrees?: number;
    endDegrees?: number;
    stepDegrees?: number;
    wavelengthNm?: number;
  } = {},
): ReflectancePoint[] {
  const startDegrees = options.startDegrees ?? bioNavisNavi210aVasaPreset.angularRangeDegrees.min;
  const endDegrees = options.endDegrees ?? bioNavisNavi210aVasaPreset.angularRangeDegrees.max;
  const stepDegrees = options.stepDegrees ?? 0.05;
  const points: ReflectancePoint[] = [];

  for (
    let angleDegrees = startDegrees;
    angleDegrees <= endDegrees + stepDegrees / 2;
    angleDegrees += stepDegrees
  ) {
    const roundedAngle = Number(angleDegrees.toFixed(4));
    points.push({
      angleDegrees: roundedAngle,
      reflectance: calculatePPolarizedReflectance({
        layers,
        angleDegrees: roundedAngle,
        wavelengthNm: options.wavelengthNm,
      }),
    });
  }

  return points;
}

export function findResonanceAngle(curve: ReflectancePoint[]): number {
  if (curve.length === 0) {
    throw new Error("Cannot find resonance angle for an empty curve.");
  }

  const minimumPoint = curve.reduce((minimum, point) =>
    point.reflectance < minimum.reflectance ? point : minimum,
  );

  return minimumPoint.angleDegrees;
}

export function calculateAngularShiftDegrees(referenceAngleDegrees: number, sampleAngleDegrees: number): number {
  return Number((sampleAngleDegrees - referenceAngleDegrees).toFixed(4));
}

export function calculateFixedAngleResponse(
  referenceCurve: ReflectancePoint[],
  sampleCurve: ReflectancePoint[],
  fixedAngleDegrees: number,
): number {
  const reference = interpolateReflectance(referenceCurve, fixedAngleDegrees);
  const sample = interpolateReflectance(sampleCurve, fixedAngleDegrees);

  return Number((sample - reference).toFixed(8));
}

function interpolateReflectance(curve: ReflectancePoint[], angleDegrees: number): number {
  const sorted = [...curve].sort((a, b) => a.angleDegrees - b.angleDegrees);
  const lowerIndex = sorted.findLastIndex((point) => point.angleDegrees <= angleDegrees);
  const lower = sorted[Math.max(lowerIndex, 0)];
  const upper = sorted[Math.min(lowerIndex + 1, sorted.length - 1)];

  if (!lower || !upper || lower.angleDegrees === upper.angleDegrees) {
    return lower?.reflectance ?? upper?.reflectance ?? 0;
  }

  const fraction = (angleDegrees - lower.angleDegrees) / (upper.angleDegrees - lower.angleDegrees);
  return lower.reflectance + fraction * (upper.reflectance - lower.reflectance);
}
