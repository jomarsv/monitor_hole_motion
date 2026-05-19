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
- O modulo de IA ainda e um esqueleto para ranqueamento e otimizacao.
- Parametros devem manter unidades explicitas: nm, µm, graus, RIU e µg/mL.

## Nucleo SPR

O primeiro nucleo cientifico implementa um modelo multicamada/Fresnel para luz p-polarizada em configuracao de Kretschmann. As paginas `/simulator` e `/compare` geram curvas de refletancia versus angulo entre 40 e 78 graus, estimam o angulo de ressonancia e calculam deslocamento relativo ao Au nu. Microplasticos e nanoplasticos sao representados como camadas efetivas equivalentes, nao como particulas individuais.

## Simulacao, IA e dados experimentais

Simulacao fisica e o uso de modelos matematicos para estimar resposta optica ou cinetica sob hipoteses controladas. Predicao por IA e uma inferencia computacional baseada em features e dados de treinamento, quando existirem. Dados experimentais sao medidas reais obtidas em laboratorio com protocolo, metadados, incerteza e controles. O app deve apresentar essas categorias separadamente.
