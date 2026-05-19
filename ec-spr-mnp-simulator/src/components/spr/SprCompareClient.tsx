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
import { getArchitecture } from "@/lib/spr/architectures";
import { findResonanceAngle, generateAngularReflectanceCurve } from "@/lib/spr/resonance";

const comparisonIds = [
  "bare-au",
  "au-cmd2d-laccase",
  "au-cmd2d-laccase-ps",
  "au-cmd3dl-laccase-ps",
];

const colors = ["#0f172a", "#0e7490", "#be123c", "#7c3aed"];
const visualSweepOptions = { endDegrees: 90 };

export function SprCompareClient() {
  const [mounted, setMounted] = useState(false);
  const series = useMemo(
    () =>
      comparisonIds.map((id) => {
        const architecture = getArchitecture(id);
        const curve = generateAngularReflectanceCurve(architecture.layers, visualSweepOptions);
        return {
          id,
          name: architecture.name,
          curve,
          resonanceAngle: findResonanceAngle(curve),
        };
      }),
    [],
  );

  const chartData = series[0].curve.map((point, index) => {
    const row: Record<string, number> = { angleDegrees: point.angleDegrees };
    for (const item of series) {
      row[item.id] = item.curve[index]?.reflectance ?? 0;
    }
    return row;
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Comparacao angular</h2>
        <div className="mt-4 h-96">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="angleDegrees"
                  type="number"
                  domain={[40, 90]}
                  tickCount={11}
                  label={{ value: "Angulo (graus)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: "Refletancia", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toFixed(5) : value,
                    series.find((item) => item.id === name)?.name ?? name,
                  ]}
                  labelFormatter={(label) => `${Number(label).toFixed(2)} graus`}
                />
                {series.map((item, index) => (
                  <Line
                    key={item.id}
                    type="monotone"
                    dataKey={item.id}
                    stroke={colors[index]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {series.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <h3 className="font-semibold text-slate-950">{item.name}</h3>
            </div>
            <p className="mt-3 font-mono text-xl text-slate-950">
              {item.resonanceAngle.toFixed(2)} graus
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
