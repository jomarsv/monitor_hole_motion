const satelliteBuckets = {
  G19: 'noaa-goes19',
  G18: 'noaa-goes18',
  G16: 'noaa-goes16',
  G17: 'noaa-goes17',
};

const allowedProducts = new Set([
  'ABI-L2-MCMIPF',
  'GLM-L2-LCFA',
  'ABI-L2-RRQPEF',
  'ABI-L2-ACHTF',
  'ABI-L2-FDCF',
]);

function getQuery(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  return url.searchParams;
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function utcPrefix(product, date) {
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 0);
  const day = Math.floor((date.getTime() - start) / 86400000).toString().padStart(3, '0');
  const hour = date.getUTCHours().toString().padStart(2, '0');
  return `${product}/${year}/${day}/${hour}/`;
}

function parseKeys(xml) {
  const matches = [...xml.matchAll(/<Key>(.*?)<\/Key>/g)];
  return matches.map((match) =>
    match[1]
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'"),
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { ok: false, error: 'Metodo nao permitido.' });
  }

  const query = getQuery(req);
  const mode = query.get('mode') ?? 'catalog';

  if (mode === 'catalog') {
    return json(res, 200, {
      ok: true,
      message: 'O frontend usa catalogo local em src/services/goesCatalog.ts.',
    });
  }

  if (mode !== 'latest') {
    return json(res, 400, { ok: false, error: 'Modo invalido.' });
  }

  const satellite = (query.get('satellite') ?? 'G19').toUpperCase();
  const product = query.get('product') ?? '';
  const bucket = satelliteBuckets[satellite];

  if (!bucket || !allowedProducts.has(product)) {
    return json(res, 400, {
      ok: false,
      warning: 'Satelite ou produto nao suportado.',
      files: [],
    });
  }

  try {
    const now = new Date();
    for (let offset = 0; offset <= 6; offset += 1) {
      const date = new Date(now.getTime() - offset * 60 * 60 * 1000);
      const prefix = utcPrefix(product, date);
      const listUrl = `https://${bucket}.s3.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
      const response = await fetch(listUrl);

      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const keys = parseKeys(xml).slice(-20);
      if (keys.length > 0) {
        return json(res, 200, {
          ok: true,
          satellite,
          bucket,
          product,
          files: keys.map((key) => ({
            key,
            url: `https://${bucket}.s3.amazonaws.com/${key}`,
            product,
            satellite,
            bucket,
            detectedAt: new Date().toISOString(),
          })),
        });
      }
    }
  } catch {
    return json(res, 200, {
      ok: false,
      warning: 'Nao foi possivel listar produtos recentes agora.',
      files: [],
    });
  }

  return json(res, 200, {
    ok: false,
    satellite,
    bucket,
    product,
    warning: 'Nao foi possivel listar produtos recentes agora.',
    files: [],
  });
}
