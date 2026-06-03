import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/server/auth";
import { canAccessAudit, listAuditEvents } from "@/lib/server/audit";
import { getRoleConfig } from "@/lib/types/hierarchy";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AuditPage() {
  const user = await requirePageSession();

  if (!canAccessAudit(user.profile.role)) {
    redirect("/");
  }

  const events = await listAuditEvents(100);
  const summary = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
          Auditoria
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-cortex-ink">
          Registro de acesso e uso da IA
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-700">
          Histórico de autenticação, perguntas submetidas, bloqueios por escopo e
          análises geradas.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-cortex-line bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cortex-forest">
            Total de eventos
          </p>
          <p className="mt-2 text-3xl font-bold text-cortex-ink">{events.length}</p>
        </div>
        <div className="rounded-lg border border-cortex-line bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cortex-forest">
            Logins
          </p>
          <p className="mt-2 text-3xl font-bold text-cortex-ink">
            {(summary.sign_in ?? 0) + (summary.bootstrap_admin ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-cortex-line bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cortex-forest">
            Perguntas
          </p>
          <p className="mt-2 text-3xl font-bold text-cortex-ink">
            {(summary.question_submitted ?? 0) + (summary.question_blocked ?? 0) + (summary.analysis_generated ?? 0)}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-cortex-line bg-white shadow-soft">
        <div className="border-b border-cortex-line px-5 py-4">
          <h2 className="text-lg font-bold text-cortex-ink">Eventos recentes</h2>
        </div>

        {events.length === 0 ? (
          <div className="px-5 py-8 text-sm text-neutral-600">
            Nenhum evento registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cortex-line text-left text-sm">
              <thead className="bg-cortex-cloud/60 text-xs uppercase tracking-[0.12em] text-neutral-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Data e hora</th>
                  <th className="px-5 py-3 font-semibold">Evento</th>
                  <th className="px-5 py-3 font-semibold">Usuário</th>
                  <th className="px-5 py-3 font-semibold">Perfil</th>
                  <th className="px-5 py-3 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cortex-line">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-5 py-4 whitespace-nowrap text-neutral-700">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-cortex-ink">
                      {event.eventType.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-cortex-ink">{event.actor.displayName}</div>
                      <div className="text-xs text-neutral-600">{event.actor.email}</div>
                    </td>
                    <td className="px-5 py-4 text-neutral-700">
                      {getRoleConfig(event.actor.role).label}
                    </td>
                    <td className="px-5 py-4 text-neutral-700">
                      <div className="space-y-1">
                        {event.context.question ? (
                          <p>
                            <span className="font-semibold text-cortex-ink">Pergunta:</span>{" "}
                            {event.context.question}
                          </p>
                        ) : null}
                        {event.context.selectedAgentName ? (
                          <p>
                            <span className="font-semibold text-cortex-ink">Agente:</span>{" "}
                            {event.context.selectedAgentName}
                          </p>
                        ) : null}
                        {event.context.blockedReason ? (
                          <p className="text-red-700">
                            <span className="font-semibold">Bloqueio:</span>{" "}
                            {event.context.blockedReason}
                          </p>
                        ) : null}
                        {event.context.analysisId ? (
                          <p>
                            <span className="font-semibold text-cortex-ink">Análise:</span>{" "}
                            {event.context.analysisId}
                          </p>
                        ) : null}
                        {event.context.ipAddress ? (
                          <p>
                            <span className="font-semibold text-cortex-ink">IP:</span>{" "}
                            {event.context.ipAddress}
                          </p>
                        ) : null}
                        {event.context.userAgent ? (
                          <p className="text-xs text-neutral-600">
                            <span className="font-semibold text-neutral-700">User agent:</span>{" "}
                            {event.context.userAgent}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

