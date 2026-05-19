import { describe, expect, it } from "vitest";
import { bioNavisNavi210aVasaPreset } from "@/config/instrumentPresets";

describe("bioNavisNavi210aVasaPreset", () => {
  it("stores the requested optical and dimensional preset", () => {
    expect(bioNavisNavi210aVasaPreset.instrument).toBe(
      "BioNavis MP-SPR Navi 210A VASA",
    );
    expect(bioNavisNavi210aVasaPreset.opticalMode).toBe("Kretschmann");
    expect(bioNavisNavi210aVasaPreset.angularRangeDegrees).toEqual({
      min: 40,
      max: 78,
    });
    expect(bioNavisNavi210aVasaPreset.defaultWavelengthNm).toBe(670);
    expect(bioNavisNavi210aVasaPreset.sensorDimensionsMm).toEqual({
      width: 20,
      height: 12,
      thickness: 0.55,
    });
    expect(bioNavisNavi210aVasaPreset.glassRefractiveIndexAt670NmRIU).toBe(
      1.5202,
    );
  });
});
