# SGTR GOES-R Ambiental

Aplicacao web independente para curadoria de produtos ambientais NOAA/NASA/GOES-R e geracao de boletins preliminares para o Maranhao.

O app nao altera o SGTR Tecnico, nao processa NetCDF pesado no frontend e nao expoe tokens no cliente.

## Instalacao

```bash
npm install
```

## Execucao local

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Variaveis de ambiente

Copie `.env.example` para `.env.local` quando necessario.

```bash
VITE_APP_NAME=SGTR GOES-R Ambiental
VITE_BACKEND_BASE_URL=https://seu-backend.com
BACKEND_API_TOKEN=coloque_token_apenas_no_ambiente_serverless
```

`VITE_BACKEND_BASE_URL` pode ser publico. `BACKEND_API_TOKEN` deve existir apenas no ambiente serverless e nunca deve ser usado no frontend.

## Deploy na Vercel

O projeto inclui `vercel.json` com:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `framework`: `vite`

Para publicar:

1. Conecte o repositorio GitHub a Vercel.
2. Configure `BACKEND_BASE_URL` e `BACKEND_API_TOKEN` nas variaveis de ambiente da Vercel.
3. Confirme o comando de build `npm run build`.
4. Publique o projeto.

## Integracao com SGTR Tecnico

O SGTR Tecnico deve consumir apenas o backend interno:

- `GET /api/environmental-bulletins?status=published`
- `GET /api/environmental-bulletins/:id`
- `GET /api/environmental-products/selected`
- `GET /api/environmental-alerts`

Ele nao deve acessar fontes NOAA/NASA diretamente nesta etapa. O SGTR GOES-R Ambiental faz a curadoria e publica boletins e metadados no backend.
