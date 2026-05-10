import { getMonitoringStatus } from "@/lib/monitoring/status";

export function MonitoringSummary() {
  const status = getMonitoringStatus();

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {status.map((item) => (
        <article
          className="rounded-lg border border-[#dce8e4] bg-white p-5 shadow-sm"
          key={item.label}
        >
          <p className="text-sm font-medium text-[#5f6f6a]">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold text-[#10201d]">
            {item.value}
          </p>
          <p className="mt-2 text-sm text-[#5f6f6a]">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
