# ec-spr-mnp-simulator

Base de um app web/PWA para simulacao de sensores MP-SPR e EC-SPR aplicados a estudos de deteccao de microplasticos e nanoplasticos em cenarios computacionais. O preset inicial considera chips compativeis com o BioNavis MP-SPR Navi 210A VASA no modo optico Kretschmann.

## Objetivo cientifico

O projeto organiza modelos de varredura angular, resposta SPR em RIU, cinetica de associacao/dissociacao e futuras rotinas de otimizacao por IA. Nesta fase, o sistema e uma base de simulacao: ele nao demonstra deteccao experimental de microplasticos ou nanoplasticos sem dados reais de bancada.

## Instalacao local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Rotas principais:

- `/simulator`: simulacao SPR angular multicamada/Fresnel.
- `/compare`: comparacao de arquiteturas SPR.
- `/kinetics`: sensorgrama Langmuir sintetico.
- `/optimizer`: ranking de arquiteturas por dados sinteticos.

## Comandos de desenvolvimento

```bash
npm run dev
npm run lint
npm test
npm run build
```

## Estrutura inicial

- `src/app`: rotas App Router e shell visual.
- `src/components`: componentes React reutilizaveis.
- `src/lib/spr`: calculos de simulacao SPR.
- `src/lib/kinetics`: modelos cineticos.
- `src/lib/ai`: funcoes de IA/otimizacao.
- `src/lib/export`: exportacao de resultados.
- `src/config`: presets instrumentais.
- `tests`: testes unitarios com Vitest.

## Limitacoes iniciais

- As curvas SPR iniciais sao sinteticas e simplificadas.
- Os valores opticos iniciais de `n` e `k` sao aproximacoes para 670 nm e devem ser refinados com dados experimentais e/ou literatura especifica para cada material, lote de chip e condicao de ensaio.
- Nao ha calibracao experimental para particulas, matrizes reais ou superficies funcionalizadas.
- O modulo de IA/Otimizacao usa ranking deterministico sobre dados sinteticos, nao um modelo treinado em dados experimentais.
- Parametros devem manter unidades explicitas: nm, µm, graus, RIU e µg/mL.
- O app nao identifica polimero real sem validacao independente por Raman, FTIR, DLS e/ou NTA.

## Nucleo SPR

O primeiro nucleo cientifico implementa um modelo multicamada/Fresnel para luz p-polarizada em configuracao de Kretschmann. As paginas `/simulator` e `/compare` geram curvas de refletancia versus angulo entre 40 e 90 graus para visualizacao, estimam o angulo de ressonancia e calculam deslocamento relativo ao Au nu. O preset instrumental permanece documentado como 40 a 78 graus. Microplasticos e nanoplasticos sao representados como camadas efetivas equivalentes, nao como particulas individuais.

## Simulacao, IA e dados experimentais

Simulacao fisica e o uso de modelos matematicos para estimar resposta optica ou cinetica sob hipoteses controladas. Predicao por IA e uma inferencia computacional baseada em features e dados de treinamento, quando existirem. Dados experimentais sao medidas reais obtidas em laboratorio com protocolo, metadados, incerteza e controles. O app deve apresentar essas categorias separadamente.

## Como interpretar resultados

- Modelo fisico: calcula refletancia p-polarizada por Fresnel multicamada e sensorgramas Langmuir simplificados.
- Dados sinteticos: sao gerados a partir das arquiteturas, materiais aproximados e espessuras efetivas.
- Ranking por IA: e uma regra de otimizacao que combina deslocamento do alvo, resposta de controle e razao sinal/controle.
- Dados experimentais futuros: devem vir de ensaios reais com metadados, controles, repeticoes e validacao por tecnicas independentes.

## Deploy no Vercel

1. Suba o repositorio para GitHub, GitLab ou Bitbucket.
2. No Vercel, importe o projeto e selecione a pasta `ec-spr-mnp-simulator` como diretório raiz se o repositorio tiver multiplos projetos.
3. Use os comandos padrao definidos em `vercel.json`: `npm install`, `npm run build` e `npm run dev`.
4. Configure variaveis de ambiente apenas quando novos modulos exigirem servicos externos.

## Checklist de validacao cientifica

- Confirmar valores de `n` e `k` com literatura ou elipsometria no comprimento de onda usado.
- Registrar espessuras de Au, CMD, proteinas e camadas efetivas em nm.
- Separar curvas simuladas de curvas experimentais importadas.
- Validar identificacao de polimeros com Raman/FTIR e tamanho/distribuicao com DLS/NTA quando aplicavel.
- Comparar branco, controle/interferente e amostras alvo com repeticoes.
- Reportar unidades explicitamente: nm, µm, graus, RIU e µg/mL.
