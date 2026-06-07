import { baseAgents } from "@/lib/agents/agents";
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
    theme: "Agricultura, bioeconomia e segurança alimentar",
    keywords: [
      "agricultura",
      "agricola",
      "babacu",
      "pescado",
      "acai",
      "mel",
      "irrigacao",
      "agroindustria",
      "segurança alimentar",
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

function buildBlockedReason(availableAgents: typeof baseAgents): string {
  const scopes = availableAgents
    .map((agent) => agent.name.replace(/^Agente de /, "").replace(/^Agente /, ""))
    .join(", ");

  return `A pergunta está fora do escopo dos agentes disponíveis. Refaça com foco em um destes temas: ${scopes}.`;
}

export function classifyQuestion(
  question: string,
  availableAgents: typeof baseAgents = baseAgents
): AgentClassification {
  const normalizedQuestion = normalizeText(question);
  let bestMatch: { entry: (typeof keywordMap)[number]; matchedKeywords: string[] } | null = null;

  for (const entry of keywordMap) {
    const matchedKeywords = entry.keywords.filter((keyword) =>
      normalizedQuestion.includes(normalizeText(keyword))
    );

    if (matchedKeywords.length > 0) {
      if (!bestMatch || matchedKeywords.length > bestMatch.matchedKeywords.length) {
        bestMatch = { entry, matchedKeywords };
      }
    }
  }

  if (bestMatch) {
    const recommendedAgent =
      availableAgents.find((agent) => agent.id === bestMatch.entry.agentId) ?? availableAgents[0];

    return {
      theme: bestMatch.entry.theme,
      recommendedAgent,
      reason: `A pergunta contém termos associados ao tema: ${bestMatch.matchedKeywords.join(", ")}.`,
      matchedKeywords: bestMatch.matchedKeywords,
      isCoherent: true
    };
  }

  return {
    theme: "Fora do escopo",
    recommendedAgent: availableAgents[0],
    reason: buildBlockedReason(availableAgents),
    matchedKeywords: [],
    isCoherent: false,
    blockedReason: buildBlockedReason(availableAgents)
  };
}
