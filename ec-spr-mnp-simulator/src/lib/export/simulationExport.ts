export type ExportableSimulation = {
  title: string;
  generatedAtIso: string;
  notes: string;
  rows: Record<string, string | number>[];
};

export function toJsonExport(simulation: ExportableSimulation): string {
  return JSON.stringify(simulation, null, 2);
}
