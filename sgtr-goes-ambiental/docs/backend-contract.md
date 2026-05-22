# Contrato com Backend

Este contrato define os endpoints que o SGTR Tecnico deve consumir para obter boletins e produtos ambientais ja organizados pelo SGTR GOES-R Ambiental.

O SGTR Tecnico nao deve acessar NOAA, NASA, AWS Open Data ou processar NetCDF diretamente nesta etapa.

## 1. Publicar boletim

`POST /api/environmental-bulletins`

Payload: `EnvironmentalBulletin`.

Uso: recebe boletins preliminares ou publicados gerados no app ambiental.

## 2. Listar boletins publicados

`GET /api/environmental-bulletins?status=published`

Uso: permite ao SGTR Tecnico listar boletins ambientais liberados para consumo operacional.

## 3. Obter boletim

`GET /api/environmental-bulletins/:id`

Uso: retorna um boletim ambiental especifico com produtos selecionados, metadados e texto tecnico.

## 4. Listar produtos ambientais selecionados

`GET /api/environmental-products/selected`

Uso: lista produtos GOES-R/NASA/NOAA selecionados por tecnicos, incluindo URLs publicas e metadados necessarios.

## 5. Listar alertas ambientais

`GET /api/environmental-alerts`

Uso: fornece alertas ambientais derivados de boletins ou curadoria tecnica.

## Observacao de arquitetura

O backend e o unico ponto de integracao entre SGTR GOES-R Ambiental e SGTR Tecnico. O app ambiental acessa fontes publicas NOAA/NASA/GOES-R e publica resultados no backend. O SGTR Tecnico consome apenas os endpoints internos acima.
