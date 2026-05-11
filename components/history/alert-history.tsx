"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isTelemetryRemoteConfigured,
  subscribeFullAlertHistory,
} from "@/lib/monitoring/telemetryRepository";
import type { RemoteAlertEvent } from "@/lib/monitoring/remoteTypes";

type AlertHistoryProps = {
  deviceId: string;
};

export function AlertHistory({ deviceId }: AlertHistoryProps) {
  const [alerts, setAlerts] = useState<RemoteAlertEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const remoteConfigured = isTelemetryRemoteConfigured();

  useEffect(() => {
    if (!remoteConfigured) {
      return;
    }

    return subscribeFullAlertHistory(
      deviceId,
      setAlerts,
      (error) => setErrorMessage(error.message),
    );
  }, [deviceId, remoteConfigured]);

  const summary = useMemo(
    () => ({
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical").length,
      attention: alerts.filter((alert) => alert.severity === "attention").length,
      latest: alerts[0],
    }),
    [alerts],
  );

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-6 text-[#10201d] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-[#dce8e4] pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
            Historico de alertas
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {deviceId}
              </h1>
              <p className="mt-2 text-sm text-[#5f6f6a]">
                Ultimos {summary.total} eventos gravados no Firestore.
              </p>
            </div>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#c7d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] transition hover:bg-[#eef8f6]"
              href={`/remote/${deviceId}`}
            >
              Voltar ao remoto
            </a>
          </div>
        </header>

        {!remoteConfigured ? (
          <p className="rounded-md border border-[#e6b8ad] bg-[#fff3f0] px-4 py-3 text-sm font-medium text-[#8a2d1d]">
            Firebase ainda nao esta configurado. Preencha as variaveis
            NEXT_PUBLIC_FIREBASE_* em .env.local.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md border border-[#e6b8ad] bg-[#fff3f0] px-4 py-3 text-sm font-medium text-[#8a2d1d]">
            {errorMessage}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total" value={String(summary.total)} />
          <SummaryCard label="Criticos" value={String(summary.critical)} />
          <SummaryCard label="Atencao" value={String(summary.attention)} />
          <SummaryCard
            label="Ultimo alerta"
            value={formatDateTime(summary.latest?.detectedAt)}
          />
        </section>

        <section className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Eventos</h2>
            <span className="text-sm text-[#5f6f6a]">
              Mais recentes primeiro
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {alerts.length === 0 ? (
              <p className="rounded-md bg-[#f7faf9] px-3 py-3 text-sm text-[#5f6f6a]">
                Nenhum alerta recebido.
              </p>
            ) : (
              alerts.map((alert) => (
                <article
                  className={`rounded-md border p-3 ${getAlertClass(alert.severity)}`}
                  key={alert.id ?? `${alert.deviceId}-${alert.detectedAt}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{alert.title}</p>
                      <p className="mt-1 text-sm leading-5">{alert.message}</p>
                    </div>
                    <span className="rounded-md border border-current/20 bg-white/50 px-2 py-1 font-mono text-xs">
                      {formatDateTime(alert.detectedAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
                    <span className="rounded-md bg-white/60 px-2 py-1">
                      {alert.severity}
                    </span>
                    <span className="rounded-md bg-white/60 px-2 py-1">
                      {alert.acknowledged ? "reconhecido" : "pendente"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#5f6f6a]">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold">{value}</p>
    </article>
  );
}

function getAlertClass(severity: RemoteAlertEvent["severity"]) {
  return severity === "critical"
    ? "border-[#d64f35] bg-[#fff1ed] text-[#7a2416]"
    : "border-[#d99a2b] bg-[#fff8e8] text-[#6d4710]";
}

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return "sem dados";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
