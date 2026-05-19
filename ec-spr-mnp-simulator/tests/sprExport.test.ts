import { describe, expect, it } from "vitest";
import { getArchitecture } from "@/lib/spr/architectures";
import { serializeSprCsv, serializeSprJson } from "@/lib/spr/export";
import { generateAngularReflectanceCurve, findResonanceAngle } from "@/lib/spr/resonance";

describe("SPR export serialization", () => {
  it("serializes simulation parameters and curve as JSON and CSV", () => {
    const architecture = getArchitecture("bare-au");
    const curve = generateAngularReflectanceCurve(architecture.layers, { stepDegrees: 1 });
    const resonanceAngleDegrees = findResonanceAngle(curve);
    const payload = {
      architectureName: architecture.name,
      resonanceAngleDegrees,
      angularShiftDegrees: 0,
      fixedAngleResponse: 0,
      layers: architecture.layers,
      curve,
    };

    const json = serializeSprJson(payload);
    const csv = serializeSprCsv(payload);

    expect(JSON.parse(json)).toMatchObject({
      architectureName: "Au nu",
      resonanceAngleDegrees,
    });
    expect(csv).toContain("angle_degrees,reflectance");
    expect(csv).toContain("resonance_angle_degrees");
  });
});
