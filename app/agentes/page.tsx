import { AgentCard } from "@/components/agents/AgentCard";
import { AgentProposalForm } from "@/components/agents/AgentProposalForm";
import { AgentReviewPanel } from "@/components/agents/AgentReviewPanel";
import { listActiveAgents } from "@/lib/server/agentCatalog";
import { requirePageSession } from "@/lib/server/auth";
import { isRoleAtLeast } from "@/lib/types/hierarchy";

export default async function AgentsPage() {
  const user = await requirePageSession();
  const activeAgents = await listActiveAgents();
  const canReview = isRoleAtLeast(user.profile.role, "manager");

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
          Cada agente orienta a análise para um conjunto de temas relevantes ao
          desenvolvimento do Maranhão. A classificação automática usa palavras-chave
          no MVP e pode evoluir para modelos mais robustos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </section>

      <AgentProposalForm />

      {canReview ? <AgentReviewPanel /> : null}
    </div>
  );
}
