export type LangmuirInput = {
  concentrationUgMl: number;
  associationRatePerUgMlSecond: number;
  dissociationRatePerSecond: number;
  maxResponseRiu: number;
  timeSeconds: number;
};

export type SensorgramPhase = "baseline" | "association" | "wash" | "regeneration";

export type SensorgramPoint = {
  timeSeconds: number;
  gamma: number;
  responseRiu: number;
  phase: SensorgramPhase;
};

export type SensorgramInput = {
  concentrationUgMl: number;
  associationRatePerUgMlSecond: number;
  dissociationRatePerSecond: number;
  gammaMax: number;
  associationSeconds: number;
  washSeconds: number;
  baselineSeconds?: number;
  regenerationSeconds?: number;
  regenerationRatePerSecond?: number;
  timeStepSeconds?: number;
};

export function estimateLangmuirResponseRiu(input: LangmuirInput): number {
  const association = input.associationRatePerUgMlSecond * input.concentrationUgMl;
  const totalRate = association + input.dissociationRatePerSecond;

  if (totalRate <= 0) {
    return 0;
  }

  const equilibriumFraction = association / totalRate;
  const response =
    input.maxResponseRiu *
    equilibriumFraction *
    (1 - Math.exp(-totalRate * input.timeSeconds));

  return Number(response.toExponential(6));
}

export function simulateLangmuirSensorgram(input: SensorgramInput): SensorgramPoint[] {
  const baselineSeconds = input.baselineSeconds ?? 60;
  const regenerationSeconds = input.regenerationSeconds ?? 0;
  const regenerationRatePerSecond = input.regenerationRatePerSecond ?? input.dissociationRatePerSecond * 8;
  const timeStepSeconds = input.timeStepSeconds ?? 1;
  const points: SensorgramPoint[] = [];
  let gamma = 0;
  let timeSeconds = 0;

  function pushPoint(phase: SensorgramPhase) {
    points.push({
      timeSeconds: Number(timeSeconds.toFixed(3)),
      gamma: Number(gamma.toExponential(6)),
      responseRiu: Number(gamma.toExponential(6)),
      phase,
    });
  }

  function advance(phase: SensorgramPhase, durationSeconds: number, concentrationUgMl: number, regeneration = false) {
    const steps = Math.max(0, Math.round(durationSeconds / timeStepSeconds));

    for (let step = 0; step < steps; step += 1) {
      pushPoint(phase);
      const associationTerm =
        input.associationRatePerUgMlSecond *
        concentrationUgMl *
        Math.max(input.gammaMax - gamma, 0);
      const dissociationTerm = input.dissociationRatePerSecond * gamma;
      const regenerationTerm = regeneration ? regenerationRatePerSecond * gamma : 0;
      const deltaGamma = (associationTerm - dissociationTerm - regenerationTerm) * timeStepSeconds;
      gamma = Math.max(0, Math.min(input.gammaMax, gamma + deltaGamma));
      timeSeconds += timeStepSeconds;
    }
  }

  advance("baseline", baselineSeconds, 0);
  advance("association", input.associationSeconds, input.concentrationUgMl);
  advance("wash", input.washSeconds, 0);

  if (regenerationSeconds > 0) {
    advance("regeneration", regenerationSeconds, 0, true);
  }

  pushPoint(regenerationSeconds > 0 ? "regeneration" : "wash");

  return points;
}
