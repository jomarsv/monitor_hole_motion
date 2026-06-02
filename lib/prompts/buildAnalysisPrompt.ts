import type { Agent } from "@/lib/types/agent";
import type { AgentClassification } from "@/lib/types/agent";
import type { UserProfile } from "@/lib/types/auth";
import type { LibraryItem } from "@/lib/types/library";

type BuildAnalysisPromptInput = {
  question: string;
  agent: Agent;
  classification: AgentClassification;
  user: Pick<UserProfile, "displayName" | "email" | "role" | "accessLevel">;
  libraryContext: Array<Pick<LibraryItem, "id" | "title" | "accessLevel" | "summary" | "tags">>;
};

export function buildAnalysisPrompt({
  question,
  agent,
  classification,
  user,
  libraryContext
}: BuildAnalysisPromptInput): string {
  const libraryContextText =
    libraryContext.length === 0
      ? "Nenhum item relevante da biblioteca privada foi encontrado para o nivel de acesso atual."
      : libraryContext
          .map(
            (item) =>
              `- ${item.title} (nivel ${item.accessLevel}) | tags: ${item.tags.join(", ")} | resumo: ${item.summary}`
          )
          .join("\n");

  return [
    "Voce esta atuando no CortexMA, plataforma de inteligencia estrategica para o desenvolvimento do Estado do Maranhao.",
    "",
    `Usuario autenticado: ${user.displayName} <${user.email}>`,
    `Perfil de acesso: ${user.role} (${user.accessLevel})`,
    `Pergunta estrategica do usuario: ${question}`,
    `Agente selecionado: ${agent.name}`,
    `Tema classificado: ${classification.theme}`,
    `Justificativa da classificacao: ${classification.reason}`,
    "",
    "Biblioteca privada autorizada para esta consulta:",
    libraryContextText,
    "",
    "Tarefa:",
    "Produza uma analise preliminar tecnica, formal e orientada a planejamento estrategico. A resposta deve apoiar diagnosticos territoriais, formulacao de projetos, analise de riscos, identificacao de oportunidades e construcao de cenarios futuros.",
    "",
    "Regras obrigatorias:",
    "- Nao invente dados numericos, indicadores, rankings ou percentuais.",
    "- Quando fizer inferencias, escreva explicitamente que sao inferencias preliminares.",
    "- Informe quais dados seriam necessarios para validar melhor a analise.",
    "- Sugira fontes publicas como IBGE, IMESC, INEP, IPEA, DataSUS, dados abertos, portais estaduais, estudos tecnicos e planos oficiais.",
    "- Use a biblioteca privada autorizada como fonte complementar, sem extrapolar o nivel de acesso do usuario.",
    "- Nao trate a resposta como decisao final; apresente-a como analise preliminar para validacao humana.",
    "- Responda em portugues do Brasil.",
    "- Use Markdown com exatamente os titulos abaixo, na mesma ordem.",
    "",
    "Formato obrigatorio:",
    "## 1. Resumo executivo",
    "## 2. Classificacao do problema",
    "## 3. Diagnostico inicial",
    "## 4. Principais causas estruturais",
    "## 5. Oportunidades estrategicas",
    "## 6. Riscos e desafios",
    "## 7. Atores envolvidos",
    "## 8. Possiveis solucoes",
    "## 9. Projetos que poderiam ser criados",
    "## 10. Indicadores que devem ser monitorados",
    "## 11. Fontes publicas que deveriam ser consultadas",
    "## 12. Lacunas de informacao",
    "## 13. Proximos passos recomendados",
    "## 14. Nivel de confianca da analise",
    "",
    "No item 14, escreva somente uma das opcoes e uma justificativa curta: baixo, medio ou alto."
  ].join("\n");
}
