export function LoadingAnalysis() {
  return (
    <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3 text-cortex-forest">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-cortex-line border-t-cortex-forest"
          aria-hidden="true"
        />
        <p className="font-semibold">A IA esta analisando a pergunta estrategica.</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        O CortexMA esta classificando o tema, acionando o agente adequado e estruturando
        um diagnostico preliminar para validacao humana.
      </p>
    </div>
  );
}
