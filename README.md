# SGTR Agricultor

Aplicacao web para leitura do boletim publico por municipio do Maranhão.

Este app nao acessa NOAA/NASA/AWS diretamente. Ele consome apenas o boletim publicado pelo backend do SGTR GOES-R Ambiental.

## O que o app mostra

- municipio selecionado
- data de geracao
- validade do boletim
- texto para agricultor
- nivel de risco
- recomendacao pratica

## Estrutura

```text
app/
components/
lib/
```

## Execucao local

```bash
npm install
npm run dev
```

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e ajuste a origem do backend.

```bash
GOES_AMBIENTAL_BASE_URL=https://sgtr-goes-ambiental.vercel.app
```

Se a variavel nao for configurada, o app usa a origem padrao do backend publicado.

## Fluxo de consumo

1. O usuario seleciona um municipio.
2. O frontend chama `GET /api/agricultor/bulletin`.
3. O endpoint server-side busca `GET /api/environmental-bulletins/latest`.
4. O app exibe apenas o boletim publico do agricultor.

## Contrato publico esperado

O backend retorna um objeto com:

- `ok`
- `source`
- `bulletin.id`
- `bulletin.municipioId`
- `bulletin.municipioNome`
- `bulletin.uf`
- `bulletin.status`
- `bulletin.generatedAt`
- `bulletin.validUntil`
- `bulletin.producerText`
- `bulletin.riskLevel`
- `bulletin.recommendation`
- `bulletin.generationMode`

O app nao exibe `technicalText`.

