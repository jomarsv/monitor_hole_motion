"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { simulateLangmuirSensorgram } from "@/lib/kinetics/langmuir";

export function KineticsClient() {
  const [mounted, setMounted] = useState(false);
  const [concentrationUgMl, setConcentrationUgMl] = useState(5);
  const [ka, setKa] = useState(0.0004);
  const [kd, setKd] = useState(0.001);
  const [gammaMax, setGammaMax] = useState(0.004);
  const [associationSeconds, setAssociationSeconds] = useState(240);
  const [washSeconds, setWashSeconds] = useState(240);
  const [regenerationSeconds, setRegenerationSeconds] = useState(0);

  const sensorgram = useMemo(
    () =>
      simulateLangmuirSensorgram({
        concentrationUgMl,
        associationRatePerUgMlSecond: ka,
        dissociationRatePerSecond: kd,
        gammaMax,
        associationSeconds,
        washSeconds,
        regenerationSeconds,
        timeStepSeconds: 2,
      }),
    [associationSeconds, concentrationUgMl, gammaMax, ka, kd, regenerationSeconds, washSeconds],
  );

  const maxResponse = Math.max(...sensorgram.map((point) => point.responseRiu));

  useEffect(() => {
    const handle = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
        <NumberControl label="Concentracao (µg/mL)" value={concentrationUgMl} step={0.5} onChange={setConcentrationUgMl} />
        <NumberControl label="ka (1/(µg/mL*s))" value={ka} step={0.0001} onChange={setKa} />
        <NumberControl label="kd (1/s)" value={kd} step={0.0001} onChange={setKd} />
        <NumberControl label="GammaMax (RIU)" value={gammaMax} step={0.0005} onChange={setGammaMax} />
        <NumberControl label="Associacao (s)" value={associationSeconds} step={30} onChange={setAssociationSeconds} />
        <NumberControl label="Lavagem (s)" value={washSeconds} step={30} onChange={setWashSeconds} />
        <NumberControl label="Regeneracao opcional (s)" value={regenerationSeconds} step={30} onChange={setRegenerationSeconds} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Metric label="Resposta maxima simulada" value={`${maxResponse.toExponential(3)} RIU`} />
        <Metric label="Pontos do sensorgrama" value={String(sensorgram.length)} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Resposta versus tempo</h2>
        <div className="mt-4 h-96">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorgram} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timeSeconds"
                  type="number"
                  label={{ value: "Tempo (s)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  label={{ value: "Resposta (RIU)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toExponential(4) : value,
                    name === "responseRiu" ? "Resposta (RIU)" : name,
                  ]}
                  labelFormatter={(label) => `${Number(label).toFixed(0)} s`}
                />
                <Line
                  type="monotone"
                  dataKey="responseRiu"
                  stroke="#0e7490"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function NumberControl({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 rounded-md border border-slate-300 px-3 text-slate-950"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
