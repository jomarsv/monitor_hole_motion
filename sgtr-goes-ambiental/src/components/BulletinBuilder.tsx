import type { EnvironmentalBulletin, EnvironmentalBulletinStatus, SelectedGoesProduct } from '../types/goes';

type BulletinBuilderProps = {
  bulletin: EnvironmentalBulletin;
  selectedProducts: SelectedGoesProduct[];
  publishState: string;
  onChange: (updates: Partial<EnvironmentalBulletin>) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onSaveDraft: () => void;
  onClear: () => void;
  onPublish: () => void;
};

export function BulletinBuilder({
  bulletin,
  selectedProducts,
  publishState,
  onChange,
  onGenerate,
  onCopy,
  onSaveDraft,
  onClear,
  onPublish,
}: BulletinBuilderProps) {
  return (
    <section className="panel bulletin">
      <div className="section-heading">
        <h2>Boletim preliminar</h2>
        <span>{selectedProducts.length} produto(s) selecionado(s)</span>
      </div>

      <div className="form-grid">
        <label>
          Titulo
          <input value={bulletin.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label>
          Regiao
          <input value={bulletin.region} onChange={(event) => onChange({ region: event.target.value })} />
        </label>
        <label>
          Status
          <select
            value={bulletin.status}
            onChange={(event) => onChange({ status: event.target.value as EnvironmentalBulletinStatus })}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
      </div>

      <label>
        Resumo
        <textarea value={bulletin.summary} onChange={(event) => onChange({ summary: event.target.value })} />
      </label>
      <label>
        Texto tecnico
        <textarea
          className="large"
          value={bulletin.technicalText}
          onChange={(event) => onChange({ technicalText: event.target.value })}
        />
      </label>
      <label>
        Limitacoes
        <textarea value={bulletin.limitations} onChange={(event) => onChange({ limitations: event.target.value })} />
      </label>

      <div className="selected-list">
        {selectedProducts.map((product) => (
          <span key={`${product.id}-${product.selectedAt}`}>{product.title}</span>
        ))}
      </div>

      <div className="button-row">
        <button className="button secondary" type="button" onClick={onGenerate}>
          Gerar texto automatico
        </button>
        <button className="button secondary" type="button" onClick={onCopy}>
          Copiar boletim
        </button>
        <button className="button secondary" type="button" onClick={onSaveDraft}>
          Salvar rascunho local
        </button>
        <button className="button secondary" type="button" onClick={onClear}>
          Limpar
        </button>
        <button className="button" type="button" onClick={onPublish}>
          Publicar no backend
        </button>
      </div>
      {publishState ? <p className="publish-state">{publishState}</p> : null}
    </section>
  );
}
