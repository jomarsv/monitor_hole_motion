import { describe, expect, it } from "vitest";
import { simulateLangmuirSensorgram } from "@/lib/kinetics/langmuir";

describe("simulateLangmuirSensorgram", () => {
  it("generates baseline, association and wash phases", () => {
    const sensorgram = simulateLangmuirSensorgram({
      concentrationUgMl: 5,
      associationRatePerUgMlSecond: 0.0004,
      dissociationRatePerSecond: 0.001,
      gammaMax: 0.004,
      associationSeconds: 60,
      washSeconds: 60,
      baselineSeconds: 20,
      timeStepSeconds: 10,
    });

    expect(sensorgram.some((point) => point.phase === "baseline")).toBe(true);
    expect(sensorgram.some((point) => point.phase === "association")).toBe(true);
    expect(sensorgram.some((point) => point.phase === "wash")).toBe(true);
    expect(Math.max(...sensorgram.map((point) => point.responseRiu))).toBeGreaterThan(0);
  });

  it("supports optional regeneration", () => {
    const sensorgram = simulateLangmuirSensorgram({
      concentrationUgMl: 5,
      associationRatePerUgMlSecond: 0.0004,
      dissociationRatePerSecond: 0.001,
      gammaMax: 0.004,
      associationSeconds: 60,
      washSeconds: 60,
      regenerationSeconds: 30,
      timeStepSeconds: 10,
    });

    expect(sensorgram.some((point) => point.phase === "regeneration")).toBe(true);
  });
});
