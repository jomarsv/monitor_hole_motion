"use client";

import { useMemo, useState } from "react";
import {
  AGRICULTOR_MUNICIPALITIES,
  type AgricultorMunicipality,
} from "@/lib/agricultor-municipalities";
import {
  fetchAgricultorBulletin,
  type AgricultorBulletin,
  type AgricultorBulletinResponse,
} from "@/lib/agricultor-bulletin";

const defaultMunicipality = AGRICULTOR_MUNICIPALITIES[0];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
  });
}

function RiskBadge({ value }: { value?: AgricultorBulletin["riskLevel"] }) {
  const label = value ?? "moderado";
  const classes: Record<string, string> = {
    baixo: "bg-[#eaf4ec] text-[#2e6f4f] border-[#cfe5d4]",
    moderado: "bg-[#eef4fb] text-[#2f5f8f] border-[#d4e3f5]",
    alto: "bg-[#fff4dd] text-[#8a5b07] border-[#f0ddb0]",
    critico: "bg-[#ffe8e8] text-[#9f1d1d] border-[#f0bcbc]",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${classes[label] ?? classes.moderado}`}>
      {label}
    </span>
  );
}

export function AgricultorBulletinView() {
  const [municipio, setMunicipio] =
    useState<AgricultorMunicipality>(defaultMunicipality);
  const [response, setResponse] = useState<AgricultorBulletinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    "Selecione um município para carregar o boletim público.",
  );

  const bulletin = response?.ok ? response.bulletin : null;

  const mapUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${municipio.municipioNome}, Maranhão`,
      )}`,
    [municipio.municipioNome],
  );

  const handleLoad = async () => {
    setLoading(true);
    setStatus("Carregando boletim público...");
    try {
      const payload = await fetchAgricultorBulletin(
        municipio.municipioId,
        municipio.municipioNome,
      );
      setResponse(payload);
      if (payload.ok) {
        setStatus(
          payload.source === "cache"
            ? "Boletim carregado do cache público."
            : "Boletim gerado sob demanda pelo backend.",
        );
      } else {
        setStatus(payload.error);
      }
    } catch {
      setResponse({ ok: false, error: "Falha ao carregar o boletim do agricultor." });
      setStatus("Falha ao carregar o boletim do agricultor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f6f2] px-4 py-6 text-[#16211f] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="rounded-2xl border border-[#d7ded8] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a6b5f]">
            SGTR Agricultor
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Boletim para o produtor
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52615c]">
            Interface de leitura simples. Este app consome apenas o boletim
            público por município publicado pelo SGTR GOES-R Ambiental.
          </p>
        </header>

        <section className="rounded-2xl border border-[#d7ded8] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#1e2c28]">
                Município
              </span>
              <select
                className="w-full rounded-xl border border-[#cdd7d1] bg-white px-4 py-3 text-base outline-none ring-0 focus:border-[#4a6b5f]"
                value={municipio.municipioId}
                onChange={(event) => {
                  const next = AGRICULTOR_MUNICIPALITIES.find(
                    (item) => item.municipioId === event.target.value,
                  );
                  if (next) setMunicipio(next);
                  setResponse(null);
                  setStatus("Selecione um município e carregue o boletim.");
                }}
              >
                {AGRICULTOR_MUNICIPALITIES.map((item) => (
                  <option key={item.municipioId} value={item.municipioId}>
                    {item.municipioNome}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="min-h-12 rounded-xl bg-[#2f7a5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28684f] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleLoad}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Ver boletim"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#52615c]">
            <span className="rounded-full bg-[#eef4ef] px-3 py-1 font-medium text-[#2f7a5e]">
              {municipio.municipioNome}
            </span>
            <a
              className="text-[#2f7a5e] underline underline-offset-4"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir mapa de referência
            </a>
          </div>

          <p className="mt-4 rounded-xl border border-[#edd9ad] bg-[#fff7e8] px-4 py-3 text-sm font-medium text-[#8a5b07]">
            {status}
          </p>
        </section>

        {bulletin ? (
          <section className="rounded-2xl border border-[#d7ded8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#4a6b5f]">Boletim público</p>
                <h2 className="mt-1 text-2xl font-semibold">{bulletin.municipioNome}</h2>
                <p className="mt-1 text-sm text-[#52615c]">
                  Gerado em {formatDateTime(bulletin.generatedAt)} · válido até{" "}
                  {formatDateTime(bulletin.validUntil)}
                </p>
              </div>
              <RiskBadge value={bulletin.riskLevel} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#e3e8e4] bg-[#fbfcfb] p-4">
                <h3 className="text-sm font-semibold text-[#1e2c28]">Mensagem ao produtor</h3>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#24322e]">
                  {bulletin.producerText}
                </p>
              </article>

              <article className="rounded-2xl border border-[#e3e8e4] bg-[#fbfcfb] p-4">
                <h3 className="text-sm font-semibold text-[#1e2c28]">Orientação prática</h3>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#24322e]">
                  {bulletin.recommendation ?? "Acompanhe as condições locais e as fontes oficiais."}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[#6a7b76]">Modo</dt>
                    <dd className="font-medium text-[#24322e]">{bulletin.generationMode ?? "on_demand"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6a7b76]">UF</dt>
                    <dd className="font-medium text-[#24322e]">{bulletin.uf}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
