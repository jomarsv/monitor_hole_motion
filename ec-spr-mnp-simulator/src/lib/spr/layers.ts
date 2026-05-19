import type { MaterialId } from "./materials";
import { materials } from "./materials";

export type SprLayer = {
  id: string;
  name: string;
  thicknessNm: number;
  n: number;
  k: number;
  active: boolean;
  description: string;
  materialId?: MaterialId;
};

export function layerFromMaterial(
  materialId: MaterialId,
  thicknessNm: number,
  overrides: Partial<Pick<SprLayer, "id" | "name" | "active" | "description">> = {},
): SprLayer {
  const material = materials[materialId];

  return {
    id: overrides.id ?? material.id,
    name: overrides.name ?? material.label,
    thicknessNm,
    n: material.n,
    k: material.k,
    active: overrides.active ?? true,
    description: overrides.description ?? material.description,
    materialId,
  };
}

export function activeLayers(layers: SprLayer[]): SprLayer[] {
  return layers.filter((layer) => layer.active && layer.thicknessNm > 0);
}
