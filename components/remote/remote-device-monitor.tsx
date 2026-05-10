"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isTelemetryRemoteConfigured,
  subscribeAlertHistory,
  subscribeRemoteDevice,
  subscribeTelemetryHistory,
} from "@/lib/monitoring/telemetryRepository";
import type {
  RemoteAlertEvent,
  RemoteDeviceState,
  RemoteTelemetrySample,
} from "@/lib/monitoring/remoteTypes";
import type { Vector3 } from "@/lib/ble/sensorTypes";

type RemoteDeviceMonitorProps = {
  deviceId: string;
};

export function RemoteDeviceMonitor({ deviceId }: RemoteDeviceMonitorProps) {
  const [deviceState, setDeviceState] = useState<RemoteDeviceState | null>(null);
  const [samples, setSamples] = useState<RemoteTelemetrySample[]>([]);
  const [alerts, setAlerts] = useState<RemoteAlertEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const remoteConfigured = isTelemetryRemoteConfigured();

  useEffect(() => {
    if (!remoteConfigured) {
      return;
    }

    const onError = (error: Error) => setErrorMessage(error.message);
    const unsubscribers = [
      subscribeRemoteDevice(deviceId, setDeviceState, onError),
      subscribeTelemetryHistory(deviceId, setSamples, onError),
      subscribeAlertHistory(deviceId, setAlerts, onError),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [deviceId, remoteConfigured]);

  const accelerationSeries = useMemo(
    () =>
      samples.map((sample) => ({
        x: sample.snapshot.acceleration?.x ?? 0,
        y: sample.snapshot.acceleration?.y ?? 0,
        z: sample.snapshot.acceleration?.z ?? 0,
      })),
    [samples],
  );

  const eulerSeries = useMemo(
    () =>
      samples.map((sample) => ({
        x: sample.snapshot.euler?.x ?? 0,
        y: sample.snapshot.euler?.y ?? 0,
        z: sample.snapshot.euler?.z ?? 0,
      })),
    [samples],
  );

  const severityClass =
    deviceState?.severity === "critical"
      ? "border-[#d64f35] bg-[#fff1ed] text-[#7a2416]"
      : deviceState?.severity === "attention"
        ? "border-[#d99a2b] bg-[#fff8e8] text-[#6d4710]"
        : "border-[#cfe0db] bg-white text-[#264541]";

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-6 text-[#10201d] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-[#dce8e4] pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
            Monitor remoto
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            {deviceId}
          </h1>
          <p className="mt-2 text-sm text-[#5f6f6a]">
            Acesso para celular via Firestore. O computador perto do sensor
            precisa manter a tela /monitor conectada.
          </p>
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

        <section className={`rounded-lg border p-4 shadow-sm ${severityClass}`}>
          <div className="grid gap-4 md:grid-cols-4">
            <StatusMetric
              label="Estado"
              value={deviceState ? deviceState.severity : "sem dados"}
            />
            <StatusMetric
              label="BLE"
              value={deviceState?.bleStatus ?? "desconhecido"}
            />
            <StatusMetric
              label="Ultima leitura"
              value={formatTimestamp(deviceState?.lastSeenAt)}
            />
            <StatusMetric
              label="Amostras"
              value={String(deviceState?.metrics.sampleCount ?? 0)}
            />
            <StatusMetric
              label="Incl. sustentada"
              value={deviceState?.metrics.sustainedTilt ? "sim" : "nao"}
            />
            <StatusMetric
              label="Imobilidade"
              value={deviceState?.metrics.relativeInactivity ? "sim" : "nao"}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <VectorCard
            label="Aceleracao"
            unit="g"
            value={deviceState?.snapshot.acceleration}
          />
          <VectorCard
            label="Giroscopio"
            unit="deg/s"
            value={deviceState?.snapshot.gyroscope}
          />
          <VectorCard
            label="Euler"
            unit="deg"
            value={deviceState?.snapshot.euler}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            labels={["x", "y", "z"]}
            samples={accelerationSeries}
            title="Aceleracao recente"
          />
          <ChartCard
            labels={["roll", "pitch", "yaw"]}
            samples={eulerSeries}
            title="Roll, pitch e yaw recentes"
          />
        </section>

        <section className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Alertas recentes</h2>
            <span className="text-sm text-[#5f6f6a]">{alerts.length} eventos</span>
          </div>
          <div className="mt-4 grid gap-3">
            {alerts.length === 0 ? (
              <p className="rounded-md bg-[#f7faf9] px-3 py-3 text-sm text-[#5f6f6a]">
                Nenhum alerta recebido.
              </p>
            ) : (
              alerts.map((alert) => (
                <article
                  className="rounded-md border border-[#e4eeeb] bg-[#f7faf9] p-3"
                  key={alert.id ?? `${alert.id}-${alert.detectedAt}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{alert.title}</p>
                    <span className="font-mono text-xs text-[#5f6f6a]">
                      {formatTimestamp(alert.detectedAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#5f6f6a]">{alert.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-current/15 bg-white/60 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-1 font-mono text-sm">{value}</p>
    </div>
  );
}

function VectorCard({
  label,
  value,
  unit,
}: {
  label: string;
  value?: Vector3;
  unit: string;
}) {
  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#5f6f6a]">{label}</p>
      <div className="mt-4 grid gap-2">
        <MetricRow label="X" unit={unit} value={value?.x} />
        <MetricRow label="Y" unit={unit} value={value?.y} />
        <MetricRow label="Z" unit={unit} value={value?.z} />
      </div>
    </article>
  );
}

function MetricRow({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 rounded-md bg-[#f7faf9] px-3 py-1.5">
      <span className="text-xs font-semibold text-[#5f6f6a]">{label}</span>
      <span className="text-right font-mono text-sm">
        {formatNumber(value)}
        <span className="ml-1 text-[#6f7f7a]">{unit}</span>
      </span>
    </div>
  );
}

function ChartCard({
  title,
  samples,
  labels,
}: {
  title: string;
  samples: Vector3[];
  labels: [string, string, string];
}) {
  const series = [
    { label: labels[0], color: "#176b5e", values: samples.map((item) => item.x) },
    { label: labels[1], color: "#b2462c", values: samples.map((item) => item.y) },
    { label: labels[2], color: "#3e5f9d", values: samples.map((item) => item.z) },
  ];

  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="flex flex-wrap gap-3">
          {series.map((item) => (
            <span
              className="flex items-center gap-1.5 text-xs font-medium text-[#5f6f6a]"
              key={item.label}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <LineChart series={series} />
    </article>
  );
}

function LineChart({
  series,
}: {
  series: { label: string; color: string; values: number[] }[];
}) {
  const width = 720;
  const height = 240;
  const padding = 28;
  const allValues = series.flatMap((item) => item.values);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : -1;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  const range = maxValue - minValue || 1;

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-[#e4eeeb] bg-[#fbfdfc]">
      <svg
        aria-label="Grafico remoto"
        className="block h-[240px] w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          stroke="#d6e3df"
          strokeDasharray="4 4"
          x1={padding}
          x2={width - padding}
          y1={height / 2}
          y2={height / 2}
        />
        {series.map((item) => (
          <path
            d={buildPath(item.values, {
              width,
              height,
              padding,
              minValue,
              range,
            })}
            fill="none"
            key={item.label}
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        ))}
        {allValues.length === 0 ? (
          <text
            fill="#7b8b86"
            fontSize="14"
            textAnchor="middle"
            x={width / 2}
            y={height / 2}
          >
            Aguardando dados
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function buildPath(
  values: number[],
  bounds: {
    width: number;
    height: number;
    padding: number;
    minValue: number;
    range: number;
  },
) {
  if (values.length === 0) {
    return "";
  }

  const drawableWidth = bounds.width - bounds.padding * 2;
  const drawableHeight = bounds.height - bounds.padding * 2;
  const xStep = values.length > 1 ? drawableWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = bounds.padding + index * xStep;
      const normalized = (value - bounds.minValue) / bounds.range;
      const y = bounds.padding + drawableHeight - normalized * drawableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatNumber(value?: number) {
  return value === undefined ? "--" : value.toFixed(3);
}

function formatTimestamp(timestamp?: number) {
  if (!timestamp) {
    return "sem dados";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
