import { FeatureLink } from "@/components/FeatureLink";
import { bioNavisNavi210aVasaPreset } from "@/config/instrumentPresets";

export default function Home() {
  const preset = bioNavisNavi210aVasaPreset;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            MP-SPR / EC-SPR · simulacao cientifica
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            ec-spr-mnp-simulator
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            App web/PWA para explorar simulacoes fisicas de sensores MP-SPR e
            EC-SPR aplicados a cenarios hipoteticos de microplasticos e
            nanoplasticos. A base separa calculos de SPR, modelos cineticos,
            rotinas de exportacao e futuras estrategias de IA, sempre
            distinguindo simulacao de dados experimentais reais.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureLink
            href="/simulador-spr"
            label="Simulador SPR"
            detail="Varredura angular em graus, comprimento de onda em nm e resposta em RIU."
          />
          <FeatureLink
            href="/comparador-de-chips"
            label="Comparador de chips"
            detail="Comparacao de chips e superficies compativeis com ensaios MP-SPR."
          />
          <FeatureLink
            href="/cinetica"
            label="Cinetica"
            detail="Modelos de associacao e dissociacao com concentracao em µg/mL."
          />
          <FeatureLink
            href="/ia-otimizacao"
            label="IA/Otimizacao"
            detail="Area reservada para predicoes computacionais, sem substituir experimentos."
          />
        </div>

        <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700 sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-slate-950">Instrumento</dt>
            <dd className="mt-1">{preset.instrument}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-950">Modo optico</dt>
            <dd className="mt-1">{preset.opticalMode}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-950">Faixa angular</dt>
            <dd className="mt-1">
              {preset.angularRangeDegrees.min} a {preset.angularRangeDegrees.max}{" "}
              graus
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
