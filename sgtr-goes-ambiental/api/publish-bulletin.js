function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function validateBulletin(payload) {
  const missing = [];
  if (!payload.title) missing.push('title');
  if (!payload.summary) missing.push('summary');
  if (!payload.technicalText) missing.push('technicalText');
  if (!payload.region) missing.push('region');
  if (!Array.isArray(payload.selectedProducts) || payload.selectedProducts.length === 0) {
    missing.push('selectedProducts');
  }
  return missing;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Metodo nao permitido.' });
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch {
    return json(res, 400, { ok: false, error: 'JSON invalido.' });
  }

  const missing = validateBulletin(payload);
  if (missing.length > 0) {
    return json(res, 400, {
      ok: false,
      error: `Campos obrigatorios ausentes: ${missing.join(', ')}.`,
    });
  }

  const backendBaseUrl = process.env.BACKEND_BASE_URL ?? process.env.VITE_BACKEND_BASE_URL;
  if (!backendBaseUrl) {
    return json(res, 200, {
      ok: true,
      mock: true,
      message: 'Boletim validado localmente. Configure BACKEND_BASE_URL para publicar.',
    });
  }

  try {
    const response = await fetch(`${backendBaseUrl.replace(/\/$/, '')}/api/environmental-bulletins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.BACKEND_API_TOKEN
          ? { Authorization: `Bearer ${process.env.BACKEND_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const responsePayload = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      return json(res, response.status, {
        ok: false,
        error: responsePayload.error ?? 'Backend recusou a publicacao do boletim.',
      });
    }

    return json(res, 200, {
      ok: true,
      id: responsePayload.id,
      message: responsePayload.message ?? 'Boletim publicado no backend.',
    });
  } catch {
    return json(res, 502, {
      ok: false,
      error: 'Falha ao comunicar com o backend configurado.',
    });
  }
}
