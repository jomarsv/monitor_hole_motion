import type { Agent } from "@/lib/types/agent";

type AgentCardProps = {
  agent: Agent;
};

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-cortex-cloud px-2.5 py-2 text-xs font-black text-cortex-forest">
          IA
        </div>
        <div>
          <h3 className="text-base font-bold leading-snug text-cortex-ink">{agent.name}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{agent.description}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {agent.focusAreas.slice(0, 5).map((area) => (
          <span
            key={area}
            className="rounded-lg border border-cortex-line bg-cortex-cloud px-2.5 py-1 text-xs font-semibold text-cortex-ink"
          >
            {area}
          </span>
        ))}
      </div>
    </article>
  );
}
