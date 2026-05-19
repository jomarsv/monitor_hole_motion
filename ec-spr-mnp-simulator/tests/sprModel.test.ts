import { describe, expect, it } from "vitest";
import { generateBaselineAngleSweep } from "@/lib/spr/angleSweep";

describe("generateBaselineAngleSweep", () => {
  it("generates points inside the configured angular range", () => {
    const sweep = generateBaselineAngleSweep(63.5, 8);

    expect(sweep).toHaveLength(8);
    expect(sweep[0]?.angleDegrees).toBe(40);
    expect(sweep.at(-1)?.angleDegrees).toBe(78);
    expect(sweep.every((point) => point.reflectance >= 0)).toBe(true);
  });
});
