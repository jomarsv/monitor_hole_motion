"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getArchitecture, sprArchitectures } from "@/lib/spr/architectures";
import type { SprLayer } from "@/lib/spr/layers";
import {
  calculateAngularShiftDegrees,
  calculateFixedAngleResponse,
  findResonanceAngle,
  generateAngularReflectanceCurve,
} from "@/lib/spr/resonance";
import { serializeSprCsv, serializeSprJson } from "@/lib/spr/export";
import { downloadTextFile } from "./download";

const referenceCurve = generateAngularReflectanceCurve(getArchitecture("bare-au").layers);
const referenceResonanceAngle = findResonanceAngle(referenceCurve);

export function SprSimulatorClient() {
  const [mounted, setMounted] = useState(false);
  const [architectureId, setArchitectureId] = useState("au-cmd2d-laccase-ps");
  const [layers, setLayers] = useState<SprLayer[]>(
    getArchitecture("au-cmd2d-laccase-ps").layers,
  );

  const architecture = useMemo(() => getArchitecture(architectureId), [architectureId]);
  const curve = useMemo(() => generateAngularReflectanceCurve(layers), [layers]);
  const resonanceAngle = useMemo(() => findResonanceAngle(curve), [curve]);
  const angularShift = calculateAngularShiftDegrees(referenceResonanceAngle, resonanceAngle);
  const fixedAngleResponse = calculateFixedAngleResponse(referenceCurve, curve, referenceResonanceAngle);
  const exportPayload = {
    architectureName: architecture.name,
    resonanceAngleDegrees: resonanceAngle,
    angularShiftDegrees: angularShift,
    fixedAngleResponse,
    layers,
    curve,
  };

  useEffect(() => {
    const handle = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(handle);
  }, []);

  function selectArchitecture(nextId: string) {
    setArchitectureId(nextId);
    setLayers(getArchitecture(nextId).layers);
  }

  function updateLayer(index: number, patch: Partial<SprLayer>) {
    setLayers((current) =>
      current.map((layer, layerIndex) =>
        layerIndex === index ? { ...layer, ...patch } : layer,
      ),
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Arquitetura predefinida
          <select
            value={architectureId}
            onChange={(event) => selectArchitecture(event.target.value)}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950"
          >
            {sprArchitectures.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                "spr-simulation.json",
                serializeSprJson(exportPayload),
                "application/json",
              )
            }
            className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                "spr-simulation.csv",
                serializeSprCsv(exportPayload),
                "text/csv",
              )
            }
            className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-950"
          >
            CSV
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Angulo de ressonancia" value={`${resonanceAngle.toFixed(2)} graus`} />
        <Metric label="Deslocamento vs. Au nu" value={`${angularShift.toFixed(2)} graus`} />
        <Metric
          label="Fixed angle"
          value={`${fixedAngleResponse.toExponential(3)} delta R`}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Refletancia p-polarizada</h2>
        <div className="mt-4 h-96">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="angleDegrees"
                  type="number"
                  domain={[40, 78]}
                  tickCount={8}
                  label={{ value: "Angulo (graus)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: "Refletancia", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? value.toFixed(5) : value
                  }
                  labelFormatter={(label) => `${Number(label).toFixed(2)} graus`}
                />
                <Line
                  type="monotone"
                  dataKey="reflectance"
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

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Editor de camadas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 pr-4">Ativa</th>
                <th className="py-3 pr-4">Camada</th>
                <th className="py-3 pr-4">Espessura (nm)</th>
                <th className="py-3 pr-4">n</th>
                <th className="py-3 pr-4">k</th>
                <th className="py-3 pr-4">Descricao</th>
              </tr>
            </thead>
            <tbody>
              {layers.map((layer, index) => (
                <tr key={layer.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={layer.active}
                      onChange={(event) => updateLayer(index, { active: event.target.checked })}
                    />
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-950">{layer.name}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={layer.thicknessNm}
                      onChange={(event) =>
                        updateLayer(index, { thicknessNm: Number(event.target.value) })
                      }
                      className="w-28 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="py-3 pr-4">{layer.n.toFixed(3)}</td>
                  <td className="py-3 pr-4">{layer.k.toFixed(3)}</td>
                  <td className="max-w-sm py-3 pr-4 text-slate-600">{layer.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
