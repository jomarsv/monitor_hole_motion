import Link from "next/link";
import { AgentCard } from "@/components/agents/AgentCard";
import { agents } from "@/lib/agents/agents";
import { requirePageSession } from "@/lib/server/auth";

export default async function HomePage() {
  await requirePageSession();

  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
            CortexMA
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight text-cortex-ink sm:text-5xl">
            Maranhao Estrategico IA
          </h1>
          <p className="mt-5 max-w-3xl text-xl leading-8 text-neutral-700">
            Plataforma de inteligencia artificial para analise de desafios,
            oportunidades e cenarios de desenvolvimento do Estado do Maranhao.
          </p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-700">
            Este MVP permite formular perguntas estrategicas, acionar agentes
            especializados de IA e gerar diagnosticos preliminares para apoiar
            planejamento territorial, politicas publicas, projetos estruturantes e
            decisoes de desenvolvimento.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/nova-analise"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white transition hover:bg-cortex-leaf"
            >
              Criar nova analise
              <span aria-hidden="true">-&gt;</span>
            </Link>
            <Link
              href="/agentes"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cortex-line bg-white px-5 py-3 text-sm font-bold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river"
            >
              Ver agentes
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
            Analise preliminar
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            As respostas geradas devem ser validadas com dados oficiais, fontes
            publicas e especialistas humanos antes de embasar decisao institucional.
          </p>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <span className="text-sm font-black text-cortex-river" aria-hidden="true">
            01
          </span>
          <h2 className="mt-3 text-base font-bold text-cortex-ink">Dados e fontes</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            A IA sugere fontes como IBGE, IMESC, INEP, IPEA, DataSUS, portais de
            dados abertos e planos oficiais.
          </p>
        </div>
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <span className="text-sm font-black text-cortex-forest" aria-hidden="true">
            02
          </span>
          <h2 className="mt-3 text-base font-bold text-cortex-ink">Planejamento publico</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            O formato de resposta organiza diagnostico, riscos, oportunidades,
            projetos, indicadores e proximos passos.
          </p>
        </div>
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <span className="text-sm font-black text-cortex-gold" aria-hidden="true">
            03
          </span>
          <h2 className="mt-3 text-base font-bold text-cortex-ink">Uso responsavel</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            O MVP evita inventar numeros e explicita inferencias quando nao ha dados
            suficientes para conclusoes definitivas.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
              Agentes iniciais
            </p>
            <h2 className="mt-2 text-2xl font-bold text-cortex-ink">
              Especialistas para analise estrategica
            </h2>
          </div>
          <Link href="/agentes" className="text-sm font-bold text-cortex-forest">
            Consultar todos
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>
    </div>
  );
}
