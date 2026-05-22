# SGTR GOES-R Ambiental

## 1. Objetivo

Executar a Etapa 1 do modulo ambiental GOES-R/NASA/NOAA, organizando produtos publicos uteis para boletins agrometeorologicos do Maranhao.

## 2. Arquitetura

- Frontend Vite, React e TypeScript para curadoria tecnica, selecao de produtos e geracao de boletins preliminares.
- Rotas serverless em `/api` para listar metadados recentes em buckets NOAA GOES e publicar boletins sem expor tokens.
- Backend externo para armazenar boletins, metadados e produtos selecionados.
- `localStorage` apenas para rascunhos locais do navegador.

## 3. Estacoes GOES/DCP x Produtos GOES-R/NASA/NOAA

Dados de estacoes GOES/DCP sao telemetrias de plataformas em solo transmitidas por satelite, como leituras hidrometeorologicas locais.

Produtos GOES-R/NASA/NOAA sao derivados ambientais de sensores orbitais e servicos publicos, como imagens ABI, GLM, estimativas de chuva, vapor d'agua, focos de calor e composicoes visuais.

Esta etapa trabalha somente com produtos ambientais GOES-R/NASA/NOAA. Dados de estacoes GOES/DCP do CEMAM ficam fora do escopo do MVP.

## 4. Produtos contemplados

- GeoColor / nuvens.
- GLM Flash Extent Density / raios.
- Vapor d'agua ABI, incluindo bandas 8, 9 e 10 e MCMIPF.
- Temperatura de topo de nuvem, ABI-L2-ACHTF.
- Chuva estimada / RRQPE, ABI-L2-RRQPEF.
- Focos de calor, ABI-L2-FDCF.
- Imagem multicanal, ABI-L2-MCMIPF.

## 5. Fluxo de publicacao no backend

1. Tecnico consulta o catalogo ambiental.
2. Tecnico busca arquivos recentes quando houver prefixo AWS publico.
3. Tecnico seleciona produtos ou arquivos para compor o boletim.
4. App gera texto preliminar e permite edicao.
5. Rota `/api/publish-bulletin` valida o boletim.
6. Se `BACKEND_BASE_URL` estiver configurado, a rota publica em `POST /api/environmental-bulletins`.
7. Se o backend nao estiver configurado, a rota retorna modo mock e nao afirma publicacao real.

## 6. Limitacoes do MVP

- Nao ha processamento pesado de NetCDF no frontend.
- Nao ha recorte automatico do Maranhao nos arquivos.
- Nao ha geracao automatica de PNG a partir de NetCDF.
- A busca recente usa listagem publica S3 e pode falhar temporariamente sem quebrar a tela.
- O boletim gerado e preliminar e exige validacao tecnica.
- Nao ha autenticacao complexa nesta etapa.

## 7. Proximos passos

- Pipeline backend para NetCDF.
- Recorte automatico do Maranhao.
- Geracao automatica de PNG.
- Extracao de estatisticas por municipio.
- Publicacao automatica de boletins.
- Integracao com dados das estacoes GOES/DCP do CEMAM.
