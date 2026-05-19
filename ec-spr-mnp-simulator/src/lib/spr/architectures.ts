import { layerFromMaterial, type SprLayer } from "./layers";

export type SprArchitecture = {
  id: string;
  name: string;
  description: string;
  layers: SprLayer[];
};

function cloneLayers(layers: SprLayer[]): SprLayer[] {
  return layers.map((layer) => ({ ...layer }));
}

const au = layerFromMaterial("gold", 50, {
  id: "au",
  name: "Au",
  description: "Filme de ouro aproximado para acoplamento SPR.",
});

const cmd2d = layerFromMaterial("cmd2d", 6, { id: "cmd2d", name: "CMD2D" });
const cmd3dl = layerFromMaterial("cmd3dLowCapacity", 18, {
  id: "cmd3dl",
  name: "CMD3DL",
});
const laccase = layerFromMaterial("laccase", 4, { id: "laccase", name: "Lacase" });
const hpp = layerFromMaterial("pp", 8, {
  id: "hpp",
  name: "HPP hidrofobico",
  description: "Camada hidrofobica efetiva aproximada.",
});

export const sprArchitectures: SprArchitecture[] = [
  {
    id: "bare-au",
    name: "Au nu",
    description: "Filme de ouro sem camada dielétrica adicional.",
    layers: [au],
  },
  {
    id: "au-cmd2d",
    name: "Au/CMD2D",
    description: "Ouro com matriz CMD2D.",
    layers: [au, cmd2d],
  },
  {
    id: "au-cmd2d-laccase",
    name: "Au/CMD2D/lacase",
    description: "Ouro, CMD2D e camada efetiva de lacase.",
    layers: [au, cmd2d, laccase],
  },
  {
    id: "au-cmd2d-laccase-ps",
    name: "Au/CMD2D/lacase/PS",
    description: "Micro/nanoplastico PS como camada efetiva.",
    layers: [au, cmd2d, laccase, layerFromMaterial("ps", 8, { id: "ps", name: "PS" })],
  },
  {
    id: "au-cmd2d-laccase-pe",
    name: "Au/CMD2D/lacase/PE",
    description: "Micro/nanoplastico PE como camada efetiva.",
    layers: [au, cmd2d, laccase, layerFromMaterial("pe", 8, { id: "pe", name: "PE" })],
  },
  {
    id: "au-cmd2d-laccase-pmma",
    name: "Au/CMD2D/lacase/PMMA",
    description: "Micro/nanoplastico PMMA como camada efetiva.",
    layers: [au, cmd2d, laccase, layerFromMaterial("pmma", 8, { id: "pmma", name: "PMMA" })],
  },
  {
    id: "au-cmd3dl-laccase",
    name: "Au/CMD3DL/lacase",
    description: "Ouro, CMD3D low capacity e lacase.",
    layers: [au, cmd3dl, laccase],
  },
  {
    id: "au-cmd3dl-laccase-ps",
    name: "Au/CMD3DL/lacase/PS",
    description: "Ouro, CMD3D low capacity, lacase e PS efetivo.",
    layers: [au, cmd3dl, laccase, layerFromMaterial("ps", 8, { id: "ps", name: "PS" })],
  },
  {
    id: "au-hpp",
    name: "Au/HPP hidrofobico",
    description: "Ouro com camada hidrofobica efetiva.",
    layers: [au, hpp],
  },
];

export function getArchitecture(id: string): SprArchitecture {
  const architecture = sprArchitectures.find((item) => item.id === id);

  if (!architecture) {
    throw new Error(`Unknown SPR architecture: ${id}`);
  }

  return {
    ...architecture,
    layers: cloneLayers(architecture.layers),
  };
}
