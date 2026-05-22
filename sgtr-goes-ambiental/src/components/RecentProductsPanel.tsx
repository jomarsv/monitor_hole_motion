import type { GoesProduct, GoesRecentFile } from '../types/goes';

type RecentProductsPanelProps = {
  activeProduct?: GoesProduct;
  files: GoesRecentFile[];
  warning?: string;
  onSelectFile: (file: GoesRecentFile) => void;
};

export function RecentProductsPanel({
  activeProduct,
  files,
  warning,
  onSelectFile,
}: RecentProductsPanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Produtos recentes</h2>
        {activeProduct ? <span>{activeProduct.title}</span> : <span>Nenhum produto consultado</span>}
      </div>

      {warning ? <p className="warning">{warning}</p> : null}
      {!warning && files.length === 0 ? (
        <p className="muted">Use "Buscar dado recente" em um produto para consultar o bucket publico NOAA.</p>
      ) : null}

      <div className="recent-list">
        {files.map((file) => (
          <article className="recent-file" key={file.key}>
            <div>
              <strong>{file.product}</strong>
              <p>{file.key}</p>
            </div>
            <div className="button-row">
              <a className="button secondary" href={file.url} target="_blank" rel="noreferrer">
                Abrir link
              </a>
              <button className="button secondary" type="button" onClick={() => navigator.clipboard.writeText(file.url)}>
                Copiar link
              </button>
              <button className="button" type="button" onClick={() => onSelectFile(file)}>
                Selecionar arquivo
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
