export type OpticalMaterial = {
  id: string;
  label: string;
  n: number;
  k: number;
  description: string;
};

export const materials = {
  glass: {
    id: "glass",
    label: "Glass",
    n: 1.5202,
    k: 0,
    description: "Prisma/vidro do chip em 670 nm.",
  },
  water: {
    id: "water",
    label: "Water",
    n: 1.333,
    k: 0,
    description: "Meio aquoso bulk.",
  },
  gold: {
    id: "gold",
    label: "Gold",
    n: 0.16,
    k: 3.45,
    description: "Ouro em 670 nm, valor aproximado de literatura.",
  },
  cmd2d: {
    id: "cmd2d",
    label: "CMD2D",
    n: 1.46,
    k: 0,
    description: "Carboxymethyl dextran 2D como camada efetiva.",
  },
  cmd3dLowCapacity: {
    id: "cmd3dLowCapacity",
    label: "CMD3D low capacity",
    n: 1.45,
    k: 0,
    description: "Matriz CMD3D de baixa capacidade como camada efetiva.",
  },
  laccase: {
    id: "laccase",
    label: "Laccase",
    n: 1.50,
    k: 0,
    description: "Enzima lacase aproximada como filme proteico.",
  },
  bsa: {
    id: "bsa",
    label: "BSA",
    n: 1.47,
    k: 0,
    description: "Albumina bovina aproximada como filme proteico.",
  },
  ps: {
    id: "ps",
    label: "PS",
    n: 1.59,
    k: 0,
    description: "Poliestireno como camada efetiva de micro/nanoplasticos.",
  },
  pe: {
    id: "pe",
    label: "PE",
    n: 1.51,
    k: 0,
    description: "Polietileno como camada efetiva de micro/nanoplasticos.",
  },
  pp: {
    id: "pp",
    label: "PP",
    n: 1.49,
    k: 0,
    description: "Polipropileno como camada efetiva de micro/nanoplasticos.",
  },
  pmma: {
    id: "pmma",
    label: "PMMA",
    n: 1.49,
    k: 0,
    description: "Polimetilmetacrilato como camada efetiva.",
  },
  pet: {
    id: "pet",
    label: "PET",
    n: 1.57,
    k: 0,
    description: "Polietileno tereftalato como camada efetiva.",
  },
  silica: {
    id: "silica",
    label: "Silica",
    n: 1.46,
    k: 0,
    description: "Silica como interferente/controle inorganico.",
  },
  humicMatter: {
    id: "humicMatter",
    label: "Humic matter",
    n: 1.53,
    k: 0.01,
    description: "Materia humica aproximada como camada orgânica absorvente.",
  },
} as const satisfies Record<string, OpticalMaterial>;

export type MaterialId = keyof typeof materials;
