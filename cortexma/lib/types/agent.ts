export type Agent = {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  systemPrompt: string;
};

export type AgentClassification = {
  theme: string;
  recommendedAgent: Agent;
  reason: string;
  matchedKeywords: string[];
};
