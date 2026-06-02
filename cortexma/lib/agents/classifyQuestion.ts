import { agents } from "@/lib/agents/agents";
import type { AgentClassification } from "@/lib/types/agent";

const keywordMap = [
  {
    agentId: "educacao-capital-humano",
    theme: "Educacao e capital humano",
    keywords: [
      "educacao",
      "alfabetizacao",
      "ideb",
      "evasao",
      "escola",
      "ensino",
      "universidade",
      "qualificacao",
      "capital humano"
    ]
  },
  {
    agentId: "infraestrutura-logistica",
    theme: "Infraestrutura e logistica",
    keywords: [
      "porto",
      "itaqui",
      "ferrovia",
      "rodovia",
      "logistica",
      "aeroporto",
      "zpe",
      "corredor logistico",
      "escoamento"
    ]
  },
  {
    agentId: "energia-sustentabilidade",
    theme: "Energia e sustentabilidade",
    keywords: [
      "solar",
      "energia",
      "eolica",
      "hidrogenio",
      "eletrificacao",
      "eficiencia energetica",
      "transicao energetica"
    ]
  },
  {
    agentId: "agricultura-bioeconomia-seguranca-alimentar",
    theme: "Agricultura, bioeconomia e seguranca alimentar",
    keywords: [
      "agricultura",
      "agricola",
      "babacu",
      "pescado",
      "acai",
      "mel",
      "irrigacao",
      "agroindustria",
      "seguranca alimentar",
      "bioeconomia"
    ]
  },
  {
    agentId: "economia-industria-inovacao",
    theme: "Economia, industria e inovacao",
    keywords: [
      "investimento",
      "industria",
      "industrializacao",
      "data center",
      "inovacao",
      "startup",
      "economia digital",
      "tecnologia"
    ]
  },
  {
    agentId: "meio-ambiente-clima",
    theme: "Meio ambiente e clima",
    keywords: [
      "clima",
      "ambiental",
      "meio ambiente",
      "saneamento",
      "agua",
      "recursos hidricos",
      "desmatamento",
      "vulnerabilidade",
      "adaptacao climatica"
    ]
  },
  {
    agentId: "projetos-financiamento",
    theme: "Projetos e financiamento",
    keywords: [
      "projeto",
      "financiamento",
      "orcamento",
      "cronograma",
      "indicador",
      "metodologia",
      "edital",
      "bndes",
      "bid"
    ]
  }
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function classifyQuestion(question: string): AgentClassification {
  const normalizedQuestion = normalizeText(question);

  for (const entry of keywordMap) {
    const matchedKeywords = entry.keywords.filter((keyword) =>
      normalizedQuestion.includes(normalizeText(keyword))
    );

    if (matchedKeywords.length > 0) {
      const recommendedAgent = agents.find((agent) => agent.id === entry.agentId) ?? agents[0];
      return {
        theme: entry.theme,
        recommendedAgent,
        reason: `A pergunta contem termos associados ao tema: ${matchedKeywords.join(", ")}.`,
        matchedKeywords
      };
    }
  }

  return {
    theme: "Planejamento territorial e desenvolvimento regional",
    recommendedAgent: agents[0],
    reason:
      "Nenhum termo tematico especifico foi identificado; o agente territorial foi selecionado como ponto de partida transversal.",
    matchedKeywords: []
  };
}
