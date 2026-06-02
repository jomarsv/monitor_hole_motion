import { AgentCard } from "@/components/agents/AgentCard";
import { agents } from "@/lib/agents/agents";
import { requirePageSession } from "@/lib/server/auth";

export default async function AgentsPage() {
  await requirePageSession();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
          Agentes de IA
        </p>
        <h1 className="mt-3 text-3xl font-bold text-cortex-ink">
          Especialistas iniciais do CortexMA
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-700">
          Cada agente orienta a analise para um conjunto de temas relevantes ao
          desenvolvimento do Maranhao. A classificacao automatica usa palavras-chave
          no MVP e pode evoluir para modelos mais robustos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </section>
    </div>
  );
}
