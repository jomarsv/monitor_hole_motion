import { describe, expect, it } from "vitest";
import { getArchitecture } from "@/lib/spr/architectures";
import {
  calculateAngularShiftDegrees,
  findResonanceAngle,
  generateAngularReflectanceCurve,
} from "@/lib/spr/resonance";

describe("SPR Fresnel resonance model", () => {
  it("generates an angular reflectance curve from 40 to 78 degrees", () => {
    const curve = generateAngularReflectanceCurve(getArchitecture("bare-au").layers, {
      stepDegrees: 0.5,
    });

    expect(curve[0]).toMatchObject({ angleDegrees: 40 });
    expect(curve.at(-1)).toMatchObject({ angleDegrees: 78 });
    expect(curve.length).toBe(77);
    expect(curve.every((point) => point.reflectance >= 0 && point.reflectance <= 1)).toBe(
      true,
    );
  });

  it("detects the minimum reflectance angle", () => {
    const curve = [
      { angleDegrees: 60, reflectance: 0.4 },
      { angleDegrees: 61, reflectance: 0.2 },
      { angleDegrees: 62, reflectance: 0.3 },
    ];

    expect(findResonanceAngle(curve)).toBe(61);
  });

  it("returns a positive angular shift after adding a dielectric layer", () => {
    const bareCurve = generateAngularReflectanceCurve(getArchitecture("bare-au").layers, {
      stepDegrees: 0.1,
    });
    const coatedCurve = generateAngularReflectanceCurve(
      getArchitecture("au-cmd2d-laccase-ps").layers,
      { stepDegrees: 0.1 },
    );

    const shift = calculateAngularShiftDegrees(
      findResonanceAngle(bareCurve),
      findResonanceAngle(coatedCurve),
    );

    expect(shift).toBeGreaterThan(0);
  });
});
