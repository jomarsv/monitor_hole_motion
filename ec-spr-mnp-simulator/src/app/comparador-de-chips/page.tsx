import { bioNavisNavi210aVasaPreset } from "@/config/instrumentPresets";

export default function ChipComparatorPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Comparador de chips</h1>
      <p className="mt-4 leading-7 text-slate-700">
        Base para comparar geometrias, materiais e superficies de chips
        compativeis com o {bioNavisNavi210aVasaPreset.instrument}. Nenhuma
        conclusao experimental deve ser inferida sem dados reais.
      </p>
    </main>
  );
}
