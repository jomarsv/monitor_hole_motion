import { layerFromMaterial, type SprLayer } from "@/lib/spr/layers";
import type { MaterialId } from "@/lib/spr/materials";
import { findResonanceAngle, generateAngularReflectanceCurve } from "@/lib/spr/resonance";

export type TargetPolymer = "PS" | "PE" | "PP" | "PMMA" | "PET";
export type ChipCandidate = "CMD2D" | "CMD3DL" | "HPP" | "Au nu";
export type Interferent = "silica" | "humic matter" | "water";

export type SyntheticArchitectureDatum = {
  chipCandidate: ChipCandidate;
  targetPolymer: TargetPolymer;
  interferent: Interferent;
  baseArchitectureName: string;
  targetArchitectureName: string;
  controlArchitectureName: string;
  baseResonanceAngleDegrees: number;
  targetResonanceAngleDegrees: number;
  controlResonanceAngleDegrees: number;
  targetShiftDegrees: number;
  controlShiftDegrees: number;
  signalControlRatio: number;
};

const polymerMaterials: Record<TargetPolymer, MaterialId> = {
  PS: "ps",
  PE: "pe",
  PP: "pp",
  PMMA: "pmma",
  PET: "pet",
};

const interferentMaterials: Record<Interferent, MaterialId | null> = {
  silica: "silica",
  "humic matter": "humicMatter",
  water: null,
};

export const targetPolymers: TargetPolymer[] = ["PS", "PE", "PP", "PMMA", "PET"];
export const chipCandidates: ChipCandidate[] = ["CMD2D", "CMD3DL", "HPP", "Au nu"];
export const interferents: Interferent[] = ["silica", "humic matter", "water"];

export function generateSyntheticArchitectureDataset(
  targetPolymer: TargetPolymer,
  interferent: Interferent,
): SyntheticArchitectureDatum[] {
  return chipCandidates.map((chipCandidate) =>
    generateSyntheticDatum(chipCandidate, targetPolymer, interferent),
  );
}

export function generateSyntheticDatum(
  chipCandidate: ChipCandidate,
  targetPolymer: TargetPolymer,
  interferent: Interferent,
): SyntheticArchitectureDatum {
  const baseLayers = buildBaseLayers(chipCandidate);
  const targetLayers = [
    ...baseLayers,
    layerFromMaterial(polymerMaterials[targetPolymer], targetThicknessNm(targetPolymer), {
      id: targetPolymer.toLowerCase(),
      name: targetPolymer,
      description: `${targetPolymer} como camada efetiva sintetica.`,
    }),
  ];
  const controlLayers = buildControlLayers(baseLayers, interferent);
  const baseResonanceAngleDegrees = resonanceFor(baseLayers);
  const targetResonanceAngleDegrees = resonanceFor(targetLayers);
  const controlResonanceAngleDegrees = resonanceFor(controlLayers);
  const targetShiftDegrees = Number(
    (targetResonanceAngleDegrees - baseResonanceAngleDegrees).toFixed(4),
  );
  const controlShiftDegrees = Number(
    Math.max(controlResonanceAngleDegrees - baseResonanceAngleDegrees, 0).toFixed(4),
  );
  const signalControlRatio = Number(
    (targetShiftDegrees / Math.max(controlShiftDegrees, 0.01)).toFixed(4),
  );

  return {
    chipCandidate,
    targetPolymer,
    interferent,
    baseArchitectureName: `${chipCandidate}`,
    targetArchitectureName: `${chipCandidate}/${targetPolymer}`,
    controlArchitectureName: `${chipCandidate}/${interferent}`,
    baseResonanceAngleDegrees,
    targetResonanceAngleDegrees,
    controlResonanceAngleDegrees,
    targetShiftDegrees,
    controlShiftDegrees,
    signalControlRatio,
  };
}

function buildBaseLayers(chipCandidate: ChipCandidate): SprLayer[] {
  const au = layerFromMaterial("gold", 50, {
    id: "au",
    name: "Au",
    description: "Filme de ouro aproximado.",
  });

  if (chipCandidate === "Au nu") {
    return [au];
  }

  if (chipCandidate === "CMD2D") {
    return [
      au,
      layerFromMaterial("cmd2d", 6, { id: "cmd2d", name: "CMD2D" }),
      layerFromMaterial("laccase", 4, { id: "laccase", name: "Lacase" }),
    ];
  }

  if (chipCandidate === "CMD3DL") {
    return [
      au,
      layerFromMaterial("cmd3dLowCapacity", 18, { id: "cmd3dl", name: "CMD3DL" }),
      layerFromMaterial("laccase", 4, { id: "laccase", name: "Lacase" }),
    ];
  }

  return [
    au,
    layerFromMaterial("pp", 8, {
      id: "hpp",
      name: "HPP hidrofobico",
      description: "Camada hidrofobica efetiva sintetica.",
    }),
  ];
}

function buildControlLayers(baseLayers: SprLayer[], interferent: Interferent): SprLayer[] {
  const materialId = interferentMaterials[interferent];

  if (!materialId) {
    return [...baseLayers];
  }

  return [
    ...baseLayers,
    layerFromMaterial(materialId, interferent === "humic matter" ? 4 : 5, {
      id: materialId,
      name: interferent,
      description: `${interferent} como camada controle/interferente sintetica.`,
    }),
  ];
}

function targetThicknessNm(targetPolymer: TargetPolymer): number {
  const thicknessByPolymer: Record<TargetPolymer, number> = {
    PS: 8,
    PE: 7,
    PP: 7,
    PMMA: 8,
    PET: 8,
  };

  return thicknessByPolymer[targetPolymer];
}

function resonanceFor(layers: SprLayer[]): number {
  const curve = generateAngularReflectanceCurve(layers, { endDegrees: 90 });
  return findResonanceAngle(curve);
}
