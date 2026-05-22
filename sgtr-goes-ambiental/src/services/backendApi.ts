import type { EnvironmentalBulletin } from '../types/goes';

export type PublishBulletinResponse = {
  ok: boolean;
  mock?: boolean;
  message?: string;
  id?: string;
  error?: string;
};

export async function publishBulletin(
  bulletin: EnvironmentalBulletin,
): Promise<PublishBulletinResponse> {
  const response = await fetch('/api/publish-bulletin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bulletin),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Falha ao publicar boletim.');
  }
  return payload;
}
