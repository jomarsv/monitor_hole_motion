import type { Agent } from "@/lib/types/agent";

const strategicRules = [
  "Atue como analista tecnico de planejamento estrategico para o Estado do Maranhao.",
  "Nao invente dados numericos, series historicas, rankings ou indicadores.",
  "Quando estiver inferindo, declare explicitamente que se trata de inferencia preliminar.",
  "Indique dados publicos necessarios para validacao humana e fontes oficiais sugeridas.",
  "Use linguagem formal, institucional e adequada a planejamento publico."
].join(" ");

export const agents: Agent[] = [
  {
    id: "planejamento-territorial",
    name: "Agente de Planejamento Territorial",
    description:
      "Analisa municipios, regioes, desigualdades territoriais, priorizacao de areas e desenvolvimento regional.",
    focusAreas: [
      "Municipios",
      "Regioes de desenvolvimento",
      "Desigualdades territoriais",
      "Priorizacao espacial",
      "Desenvolvimento regional"
    ],
    systemPrompt: `${strategicRules} Foque em municipios, regioes, desigualdades territoriais, vocacoes produtivas, acesso a servicos e priorizacao de areas.`
  },
  {
    id: "educacao-capital-humano",
    name: "Agente de Educacao e Capital Humano",
    description:
      "Avalia alfabetizacao, IDEB, evasao escolar, formacao tecnica, universidades e qualificacao profissional.",
    focusAreas: [
      "Alfabetizacao",
      "IDEB",
      "Evasao escolar",
      "Formacao tecnica",
      "Universidades",
      "Qualificacao profissional"
    ],
    systemPrompt: `${strategicRules} Foque em educacao basica, capital humano, formacao profissional, permanencia escolar, ensino superior, pesquisa aplicada e empregabilidade.`
  },
  {
    id: "infraestrutura-logistica",
    name: "Agente de Infraestrutura e Logistica",
    description:
      "Examina Porto do Itaqui, ferrovias, rodovias, aeroportos, ZPE, corredores logisticos e integracao produtiva.",
    focusAreas: [
      "Porto do Itaqui",
      "Ferrovias",
      "Rodovias",
      "Aeroportos",
      "ZPE",
      "Corredores logisticos",
      "Integracao produtiva"
    ],
    systemPrompt: `${strategicRules} Foque em infraestrutura economica, gargalos logisticos, integracao modal, custos de escoamento, conectividade e corredores produtivos.`
  },
  {
    id: "energia-sustentabilidade",
    name: "Agente de Energia e Sustentabilidade",
    description:
      "Analisa energia solar, eolica, hidrogenio verde, eletrificacao rural, eficiencia energetica e transicao energetica.",
    focusAreas: [
      "Energia solar",
      "Energia eolica",
      "Hidrogenio verde",
      "Eletrificacao rural",
      "Eficiencia energetica",
      "Transicao energetica"
    ],
    systemPrompt: `${strategicRules} Foque em potencial energetico, seguranca do suprimento, transicao energetica, oportunidades industriais verdes e impactos socioambientais.`
  },
  {
    id: "agricultura-bioeconomia-seguranca-alimentar",
    name: "Agente de Agricultura, Bioeconomia e Seguranca Alimentar",
    description:
      "Estuda agricultura familiar, babacu, pescado, acai, mel, irrigacao, agroindustria e cadeias produtivas locais.",
    focusAreas: [
      "Agricultura familiar",
      "Babacu",
      "Pescado",
      "Acai",
      "Mel",
      "Irrigacao",
      "Agroindustria",
      "Cadeias produtivas locais"
    ],
    systemPrompt: `${strategicRules} Foque em sistemas agroalimentares, inclusao produtiva, bioeconomia, seguranca alimentar, agregacao de valor e governanca de cadeias locais.`
  },
  {
    id: "economia-industria-inovacao",
    name: "Agente de Economia, Industria e Inovacao",
    description:
      "Apoia analises de atracao de investimentos, industrializacao, data centers, economia digital, startups e inovacao tecnologica.",
    focusAreas: [
      "Atracao de investimentos",
      "Industrializacao",
      "Data centers",
      "Economia digital",
      "Startups",
      "Inovacao tecnologica"
    ],
    systemPrompt: `${strategicRules} Foque em competitividade economica, politica industrial, atracao de investimentos, ambientes de inovacao, digitalizacao e produtividade.`
  },
  {
    id: "meio-ambiente-clima",
    name: "Agente de Meio Ambiente e Clima",
    description:
      "Avalia mudancas climaticas, saneamento, recursos hidricos, desmatamento, vulnerabilidade ambiental e adaptacao climatica.",
    focusAreas: [
      "Mudancas climaticas",
      "Saneamento",
      "Recursos hidricos",
      "Desmatamento",
      "Vulnerabilidade ambiental",
      "Adaptacao climatica"
    ],
    systemPrompt: `${strategicRules} Foque em riscos ambientais, vulnerabilidade climatica, saneamento, agua, uso do solo, adaptacao e resiliencia territorial.`
  },
  {
    id: "projetos-financiamento",
    name: "Agente de Projetos e Financiamento",
    description:
      "Transforma diagnosticos em projetos com objetivos, metodologia, cronograma, orcamento preliminar, indicadores e fontes de financiamento.",
    focusAreas: [
      "Projetos estruturantes",
      "Fontes de financiamento",
      "Metodologia",
      "Cronograma",
      "Orcamento preliminar",
      "Indicadores"
    ],
    systemPrompt: `${strategicRules} Foque em transformar diagnosticos em desenho preliminar de projetos, teoria de mudanca, governanca, etapas, indicadores e fontes de financiamento.`
  }
];

export function getAgentById(agentId?: string | null): Agent | undefined {
  return agents.find((agent) => agent.id === agentId);
}
