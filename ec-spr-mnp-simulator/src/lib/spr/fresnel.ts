import type { OpticalMaterial } from "./materials";
import { materials } from "./materials";
import { activeLayers, type SprLayer } from "./layers";

type Complex = {
  re: number;
  im: number;
};

const complex = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im);
const sub = (a: Complex, b: Complex): Complex => complex(a.re - b.re, a.im - b.im);
const mul = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: Complex, b: Complex): Complex => {
  const denominator = b.re * b.re + b.im * b.im;
  return complex(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator,
  );
};
const abs2 = (a: Complex): number => a.re * a.re + a.im * a.im;
const sqrt = (z: Complex): Complex => {
  const magnitude = Math.hypot(z.re, z.im);
  const real = Math.sqrt(Math.max((magnitude + z.re) / 2, 0));
  const imagSign = z.im < 0 ? -1 : 1;
  const imag = imagSign * Math.sqrt(Math.max((magnitude - z.re) / 2, 0));
  return complex(real, imag);
};
const expI = (z: Complex): Complex => complex(Math.exp(-z.im) * Math.cos(z.re), Math.exp(-z.im) * Math.sin(z.re));

function refractiveIndex(n: number, k: number): Complex {
  return complex(n, k);
}

function layerIndex(layer: Pick<SprLayer, "n" | "k"> | OpticalMaterial): Complex {
  return refractiveIndex(layer.n, layer.k);
}

function cosThetaInLayer(layerN: Complex, incidentN: Complex, angleRadians: number): Complex {
  const sinTheta0 = Math.sin(angleRadians);
  const ratio = div(mul(incidentN, complex(sinTheta0)), layerN);
  return sqrt(sub(complex(1), mul(ratio, ratio)));
}

function pAdmittance(layerN: Complex, incidentN: Complex, angleRadians: number): Complex {
  return div(cosThetaInLayer(layerN, incidentN, angleRadians), layerN);
}

function layerPhase(
  layer: SprLayer,
  incidentN: Complex,
  angleRadians: number,
  wavelengthNm: number,
): Complex {
  const nLayer = layerIndex(layer);
  const cosTheta = cosThetaInLayer(nLayer, incidentN, angleRadians);
  return mul(complex((2 * Math.PI * layer.thicknessNm) / wavelengthNm), mul(nLayer, cosTheta));
}

export type ReflectanceInput = {
  layers: SprLayer[];
  angleDegrees: number;
  wavelengthNm?: number;
  incidentMaterial?: OpticalMaterial;
  exitMaterial?: OpticalMaterial;
};

export function calculatePPolarizedReflectance({
  layers,
  angleDegrees,
  wavelengthNm = 670,
  incidentMaterial = materials.glass,
  exitMaterial = materials.water,
}: ReflectanceInput): number {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const incidentN = layerIndex(incidentMaterial);
  const finiteLayers = activeLayers(layers);
  const stack = [
    { n: incidentMaterial.n, k: incidentMaterial.k, thicknessNm: Number.POSITIVE_INFINITY },
    ...finiteLayers,
    { n: exitMaterial.n, k: exitMaterial.k, thicknessNm: Number.POSITIVE_INFINITY },
  ];
  const indices = stack.map((layer) => layerIndex(layer));
  const admittances = indices.map((index) => pAdmittance(index, incidentN, angleRadians));

  let reflectionCoefficient = interfaceReflection(
    admittances[stack.length - 2],
    admittances[stack.length - 1],
  );

  for (let mediumIndex = stack.length - 3; mediumIndex >= 0; mediumIndex -= 1) {
    const nextLayer = stack[mediumIndex + 1];
    const interfaceR = interfaceReflection(admittances[mediumIndex], admittances[mediumIndex + 1]);
    const beta = layerPhase(
      {
        id: "phase-layer",
        name: "phase-layer",
        thicknessNm: nextLayer.thicknessNm,
        n: nextLayer.n,
        k: nextLayer.k,
        active: true,
        description: "",
      },
      incidentN,
      angleRadians,
      wavelengthNm,
    );
    const phase = expI(mul(complex(2), beta));
    const numerator = add(interfaceR, mul(reflectionCoefficient, phase));
    const denominator = add(complex(1), mul(mul(interfaceR, reflectionCoefficient), phase));
    reflectionCoefficient = div(numerator, denominator);
  }

  return Number(Math.min(Math.max(abs2(reflectionCoefficient), 0), 1).toFixed(8));
}

function interfaceReflection(yA: Complex, yB: Complex): Complex {
  return div(sub(yA, yB), add(yA, yB));
}

export const fresnelInternals = {
  expI,
};
