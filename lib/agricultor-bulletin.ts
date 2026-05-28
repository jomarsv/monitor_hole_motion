export type AgricultorBulletin = {
  id: string;
  municipioId: string;
  municipioNome: string;
  uf: 'MA';
  status: 'published';
  generatedAt: string;
  validUntil: string;
  producerText: string;
  riskLevel?: 'baixo' | 'moderado' | 'alto' | 'critico';
  recommendation?: string;
  generationMode?: 'manual' | 'scheduled' | 'on_demand';
};

export type AgricultorBulletinResponse =
  | {
      ok: true;
      source: 'cache' | 'generated';
      bulletin: AgricultorBulletin;
    }
  | {
      ok: false;
      error: string;
    };

export async function fetchAgricultorBulletin(
  municipioId: string,
  municipioNome: string,
): Promise<AgricultorBulletinResponse> {
  const params = new URLSearchParams({
    municipioId,
    municipioNome,
  });

  const response = await fetch(`/api/agricultor/bulletin?${params.toString()}`, {
    cache: 'no-store',
  });

  const payload = (await response.json()) as AgricultorBulletinResponse;

  if (!response.ok) {
    return {
      ok: false,
      error: payload.ok ? 'Falha ao carregar boletim do agricultor.' : payload.error,
    };
  }

  return payload;
}

