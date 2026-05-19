# AGENTS.md

Instrucoes para agentes Codex neste projeto:

- Nao afirmar que o sensor detecta micro/nanoplasticos experimentalmente sem dados reais.
- Diferenciar simulacao fisica, predicao por IA e dados experimentais.
- Usar unidades explicitas: nm, µm, graus, RIU, µg/mL.
- Colocar calculos cientificos em `src/lib`, nunca diretamente em componentes React.
- Antes de finalizar tarefas, rodar:
  - `npm run lint`
  - `npm test`
  - `npm run build`
