import type { ReflectancePoint } from "./resonance";
import type { SprLayer } from "./layers";

export type SprExportPayload = {
  architectureName: string;
  resonanceAngleDegrees: number;
  angularShiftDegrees: number;
  fixedAngleResponse: number;
  layers: SprLayer[];
  curve: ReflectancePoint[];
};

export function serializeSprJson(payload: SprExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function serializeSprCsv(payload: SprExportPayload): string {
  const metadataRows = [
    ["architecture", payload.architectureName],
    ["resonance_angle_degrees", payload.resonanceAngleDegrees],
    ["angular_shift_degrees", payload.angularShiftDegrees],
    ["fixed_angle_response_delta_reflectance", payload.fixedAngleResponse],
    [],
    ["layers"],
    ["name", "thickness_nm", "n", "k", "active", "description"],
    ...payload.layers.map((layer) => [
      layer.name,
      layer.thicknessNm,
      layer.n,
      layer.k,
      layer.active,
      layer.description,
    ]),
    [],
    ["curve"],
    ["angle_degrees", "reflectance"],
    ...payload.curve.map((point) => [point.angleDegrees, point.reflectance]),
  ];

  return metadataRows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string | number | boolean | undefined): string {
  if (value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
