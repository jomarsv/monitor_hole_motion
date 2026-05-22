import type { GoesProduct } from '../types/goes';
import { CATEGORY_LABELS, SOURCE_LABELS } from '../services/goesCatalog';

type ProductCardProps = {
  product: GoesProduct;
  isSelected: boolean;
  isLoading: boolean;
  onFetchRecent: (product: GoesProduct) => void;
  onSelect: (product: GoesProduct) => void;
};

export function ProductCard({
  product,
  isSelected,
  isLoading,
  onFetchRecent,
  onSelect,
}: ProductCardProps) {
  const sourceUrl = product.viewerUrl ?? product.worldviewUrl ?? 'https://registry.opendata.aws/noaa-goes/';

  return (
    <article className="product-card">
      <div className="product-card__top">
        <div>
          <h3>{product.title}</h3>
          <p className="meta">
            {CATEGORY_LABELS[product.category]} · {SOURCE_LABELS[product.source]}
          </p>
        </div>
        <span className="satellite">{product.satellite ?? 'N/A'}</span>
      </div>

      <p>{product.description}</p>
      <dl>
        <dt>Uso tecnico</dt>
        <dd>{product.technicalUse}</dd>
        <dt>Uso no boletim</dt>
        <dd>{product.bulletinUse}</dd>
        <dt>Limitacoes</dt>
        <dd>{product.limitations}</dd>
      </dl>

      <div className="button-row">
        <a className="button secondary" href={sourceUrl} target="_blank" rel="noreferrer">
          Abrir fonte
        </a>
        <button className="button secondary" type="button" onClick={() => onFetchRecent(product)} disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar dado recente'}
        </button>
        <button className="button" type="button" onClick={() => onSelect(product)}>
          {isSelected ? 'Selecionado' : 'Selecionar para boletim'}
        </button>
      </div>
    </article>
  );
}
