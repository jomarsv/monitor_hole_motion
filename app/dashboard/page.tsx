import { MonitoringSummary } from "@/components/monitoring-summary";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7faf9] px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">
            Monitoramento Holy-Motion
          </h1>
        </header>
        <MonitoringSummary />
      </div>
    </main>
  );
}
