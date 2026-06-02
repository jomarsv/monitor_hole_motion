type ResponsesApiOutput = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY nao configurada.");
  }

  return apiKey;
}

export async function generateStrategicAnalysis(input: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const apiKey = getOpenAIApiKey();
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: input.systemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input.userPrompt }]
        }
      ],
      max_output_tokens: 2600
    })
  });

  const data = (await response.json().catch(() => null)) as ResponsesApiOutput | null;

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Falha ao chamar a OpenAI API.");
  }

  const text =
    data?.output_text?.trim() ??
    data?.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n")
      .trim();

  if (!text) {
    throw new Error("A OpenAI retornou uma resposta vazia.");
  }

  return text;
}
