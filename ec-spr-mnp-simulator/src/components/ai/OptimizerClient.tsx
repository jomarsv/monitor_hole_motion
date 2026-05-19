"use client";

import { useMemo, useState } from "react";
import {
  chipCandidates,
  interferents,
  targetPolymers,
  type ChipCandidate,
  type Interferent,
  type TargetPolymer,
} from "@/lib/ai/dataset-generator";
import { rankingToCsv, rankingToJson, rankArchitecturesForTarget } from "@/lib/ai/optimizer";
import { downloadTextFile } from "@/components/spr/download";

export function OptimizerClient() {
  const [targetPolymer, setTargetPolymer] = useState<TargetPolymer>("PS");
  const [selectedChip, setSelectedChip] = useState<ChipCandidate>("CMD2D");
  const [interferent, setInterferent] = useState<Interferent>("silica");
  const ranking = useMemo(
    () => rankArchitecturesForTarget(targetPolymer, selectedChip, interferent),
    [interferent, selectedChip, targetPolymer],
  );
  const best = ranking[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
        <SelectControl
          label="Polimero-alvo"
          value={targetPolymer}
          options={targetPolymers}
          onChange={(value) => setTargetPolymer(value as TargetPolymer)}
        />
        <SelectControl
          label="Chip candidato"
          value={selectedChip}
          options={chipCandidates}
          onChange={(value) => setSelectedChip(value as ChipCandidate)}
        />
        <SelectControl
          label="Interferente"
          value={interferent}
          options={interferents}
          onChange={(value) => setInterferent(value as Interferent)}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-600">Melhor arquitetura sintetica</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {best.targetArchitectureName}
        </h2>
        <p className="mt-3 leading-7 text-slate-700">{best.justification}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Ranking exportavel</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                downloadTextFile("architecture-ranking.json", rankingToJson(ranking), "application/json")
              }
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile("architecture-ranking.csv", rankingToCsv(ranking), "text/csv")
              }
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-950"
            >
              CSV
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 pr-4">Rank</th>
                <th className="py-3 pr-4">Arquitetura</th>
                <th className="py-3 pr-4">Alvo (graus)</th>
                <th className="py-3 pr-4">Controle (graus)</th>
                <th className="py-3 pr-4">Razao</th>
                <th className="py-3 pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, index) => (
                <tr key={item.chipCandidate} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-mono">{index + 1}</td>
                  <td className="py-3 pr-4 font-medium text-slate-950">
                    {item.targetArchitectureName}
                  </td>
                  <td className="py-3 pr-4">{item.targetShiftDegrees.toFixed(2)}</td>
                  <td className="py-3 pr-4">{item.controlShiftDegrees.toFixed(2)}</td>
                  <td className="py-3 pr-4">{item.signalControlRatio.toFixed(2)}</td>
                  <td className="py-3 pr-4 font-mono">{item.score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
