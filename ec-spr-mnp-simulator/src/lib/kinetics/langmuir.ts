export type LangmuirInput = {
  concentrationUgMl: number;
  associationRatePerUgMlSecond: number;
  dissociationRatePerSecond: number;
  maxResponseRiu: number;
  timeSeconds: number;
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
