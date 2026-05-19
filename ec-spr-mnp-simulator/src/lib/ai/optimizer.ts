import type {
  ChipCandidate,
  Interferent,
  SyntheticArchitectureDatum,
  TargetPolymer,
} from "./dataset-generator";
import { generateSyntheticArchitectureDataset } from "./dataset-generator";

export type ArchitectureRanking = SyntheticArchitectureDatum & {
  score: number;
  justification: string;
};

export function rankArchitecturesForTarget(
  targetPolymer: TargetPolymer,
  selectedChip: ChipCandidate,
  interferent: Interferent,
): ArchitectureRanking[] {
  const dataset = generateSyntheticArchitectureDataset(targetPolymer, interferent);
  const selectedChipBonus = 0.15;

  return dataset
    .map((datum) => {
      const score =
        datum.targetShiftDegrees * 1.6 -
        datum.controlShiftDegrees * 1.1 +
        datum.signalControlRatio * 0.35 +
        (datum.chipCandidate === selectedChip ? selectedChipBonus : 0);

      return {
        ...datum,
        score: Number(score.toFixed(4)),
        justification:
          `Deslocamento alvo ${datum.targetShiftDegrees.toFixed(2)} graus, ` +
          `controle ${datum.controlShiftDegrees.toFixed(2)} graus, ` +
          `razao sinal/controle ${datum.signalControlRatio.toFixed(2)}.`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function rankingToCsv(ranking: ArchitectureRanking[]): string {
  const rows = [
    [
      "rank",
      "chip_candidate",
      "target_polymer",
      "interferent",
      "target_shift_degrees",
      "control_shift_degrees",
      "signal_control_ratio",
      "score",
      "justification",
    ],
    ...ranking.map((item, index) => [
      index + 1,
      item.chipCandidate,
      item.targetPolymer,
      item.interferent,
      item.targetShiftDegrees,
      item.controlShiftDegrees,
      item.signalControlRatio,
      item.score,
      item.justification,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function rankingToJson(ranking: ArchitectureRanking[]): string {
  return JSON.stringify(ranking, null, 2);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
