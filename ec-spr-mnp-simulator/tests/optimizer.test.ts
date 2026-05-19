import { describe, expect, it } from "vitest";
import { generateSyntheticArchitectureDataset } from "@/lib/ai/dataset-generator";
import { rankingToCsv, rankingToJson, rankArchitecturesForTarget } from "@/lib/ai/optimizer";

describe("synthetic architecture optimizer", () => {
  it("generates one synthetic datum per chip candidate", () => {
    const dataset = generateSyntheticArchitectureDataset("PS", "silica");

    expect(dataset).toHaveLength(4);
    expect(dataset.every((item) => item.targetShiftDegrees >= 0)).toBe(true);
    expect(dataset.every((item) => item.signalControlRatio > 0)).toBe(true);
  });

  it("ranks architectures with quantitative justification", () => {
    const ranking = rankArchitecturesForTarget("PS", "CMD2D", "silica");

    expect(ranking).toHaveLength(4);
    expect(ranking[0]?.score).toBeGreaterThanOrEqual(ranking[1]?.score ?? -Infinity);
    expect(ranking[0]?.justification).toContain("Deslocamento alvo");
  });

  it("serializes optimizer ranking as CSV and JSON", () => {
    const ranking = rankArchitecturesForTarget("PET", "CMD3DL", "humic matter");

    expect(rankingToCsv(ranking)).toContain("signal_control_ratio");
    expect(JSON.parse(rankingToJson(ranking))[0]).toHaveProperty("score");
  });
});
