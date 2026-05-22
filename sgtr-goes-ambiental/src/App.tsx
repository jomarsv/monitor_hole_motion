import { useMemo, useState } from 'react';
import { BulletinBuilder } from './components/BulletinBuilder';
import { ProductCard } from './components/ProductCard';
import { RecentProductsPanel } from './components/RecentProductsPanel';
import { SourceLinks } from './components/SourceLinks';
import { TechnicalNotice } from './components/TechnicalNotice';
import { publishBulletin } from './services/backendApi';
import { fetchRecentFiles, getLocalCatalog } from './services/goesApi';
import { CATEGORY_LABELS, MARANHAO_BBOX } from './services/goesCatalog';
import type {
  EnvironmentalBulletin,
  GoesProduct,
  GoesProductCategory,
  GoesRecentFile,
  SelectedGoesProduct,
} from './types/goes';

const draftKey = 'sgtr-goes-ambiental:draft';

const createInitialBulletin = (): EnvironmentalBulletin => {
  const now = new Date().toISOString();
  return {
    title: 'Boletim Ambiental GOES-R - Maranhao',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    region: 'Maranhao',
    summary: '',
    technicalText: '',
    limitations:
      'Este boletim possui carater tecnico preliminar e nao substitui previsao meteorologica oficial, analise operacional de emergencia ou validacao por especialista.',
    selectedProducts: [],
    source: 'sgtr-goes-ambiental',
  };
};

const loadInitialBulletin = () => {
  const stored = localStorage.getItem(draftKey);
  if (!stored) return createInitialBulletin();
  try {
    return JSON.parse(stored) as EnvironmentalBulletin;
  } catch {
    return createInitialBulletin();
  }
};

const categories: Array<GoesProductCategory | 'todos'> = [
  'todos',
  'nuvens',
  'vapor_agua',
  'raios',
  'chuva',
  'topo_nuvem',
  'focos_calor',
];

function App() {
  const [category, setCategory] = useState<GoesProductCategory | 'todos'>('todos');
  const [bulletin, setBulletin] = useState<EnvironmentalBulletin>(loadInitialBulletin);
  const [activeProduct, setActiveProduct] = useState<GoesProduct>();
  const [recentFiles, setRecentFiles] = useState<GoesRecentFile[]>([]);
  const [recentWarning, setRecentWarning] = useState('');
  const [loadingProductId, setLoadingProductId] = useState('');
  const [publishState, setPublishState] = useState('');

  const catalog = getLocalCatalog();
  const filteredCatalog = useMemo(
    () => (category === 'todos' ? catalog : catalog.filter((product) => product.category === category)),
    [catalog, category],
  );

  const selectedProducts = bulletin.selectedProducts;

  const updateBulletin = (updates: Partial<EnvironmentalBulletin>) => {
    setBulletin((current) => ({
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const selectProduct = (product: GoesProduct, file?: GoesRecentFile) => {
    setBulletin((current) => {
      const alreadySelected = current.selectedProducts.some((item) => item.id === product.id);
      const selectedAt = new Date().toISOString();
      const nextProduct: SelectedGoesProduct = {
        ...product,
        selectedAt,
        recentFiles: file ? [file] : undefined,
      };

      const selectedProducts = alreadySelected
        ? current.selectedProducts.map((item) =>
            item.id === product.id
              ? { ...item, recentFiles: file ? [...(item.recentFiles ?? []), file] : item.recentFiles }
              : item,
          )
        : [...current.selectedProducts, nextProduct];

      return {
        ...current,
        selectedProducts,
        updatedAt: selectedAt,
      };
    });
  };

  const handleFetchRecent = async (product: GoesProduct) => {
    setLoadingProductId(product.id);
    setActiveProduct(product);
    setRecentWarning('');
    setRecentFiles([]);

    try {
      const response = await fetchRecentFiles(product);
      setRecentFiles(response.files);
      setRecentWarning(response.ok ? '' : response.warning ?? 'Nao foi possivel listar produtos recentes agora.');
    } catch {
      setRecentWarning('Nao foi possivel listar produtos recentes agora.');
    } finally {
      setLoadingProductId('');
    }
  };

  const handleSelectFile = (file: GoesRecentFile) => {
    if (activeProduct) {
      selectProduct(activeProduct, file);
    }
  };

  const generateAutomaticText = () => {
    const productLines = selectedProducts.length
      ? selectedProducts.map((product) => `- ${product.title}`).join('\n')
      : '- Nenhum produto selecionado';
    const localDate = new Date().toLocaleString('pt-BR');
    const technicalText = `Boletim Ambiental GOES-R - Maranhao

Data/hora de geracao: ${localDate}

Produtos utilizados:
${productLines}

Sintese preliminar:
Foram selecionados produtos ambientais GOES-R/NASA/NOAA para apoiar a analise agrometeorologica do Maranhao. A interpretacao deve considerar nebulosidade, vapor d'agua, atividade eletrica atmosferica, temperatura de topo de nuvem, estimativas de precipitacao e possiveis focos de calor, conforme os produtos escolhidos pelo tecnico.

Uso recomendado:
Os dados devem ser utilizados como subsidio a elaboracao de boletins, alertas e analises tecnicas, em conjunto com dados de estacoes em solo, previsoes oficiais e validacao local.

Limitacoes:
Este boletim possui carater tecnico preliminar e nao substitui previsao meteorologica oficial, analise operacional de emergencia ou validacao por especialista.`;

    updateBulletin({
      summary:
        'Produtos ambientais GOES-R/NASA/NOAA selecionados para apoiar a analise agrometeorologica do Maranhao.',
      technicalText,
      limitations:
        'Este boletim possui carater tecnico preliminar e nao substitui previsao meteorologica oficial, analise operacional de emergencia ou validacao por especialista.',
    });
  };

  const copyBulletin = async () => {
    await navigator.clipboard.writeText(
      `${bulletin.title}\n\nResumo:\n${bulletin.summary}\n\nTexto tecnico:\n${bulletin.technicalText}\n\nLimitacoes:\n${bulletin.limitations}`,
    );
    setPublishState('Boletim copiado para a area de transferencia.');
  };

  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify({ ...bulletin, updatedAt: new Date().toISOString() }));
    setPublishState('Rascunho salvo localmente neste navegador.');
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setBulletin(createInitialBulletin());
    setPublishState('Formulario limpo.');
  };

  const handlePublish = async () => {
    const payload: EnvironmentalBulletin = {
      ...bulletin,
      selectedProducts,
      status: bulletin.status,
      publishedAt: bulletin.status === 'published' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await publishBulletin(payload);
      setPublishState(
        response.mock
          ? response.message ?? 'Boletim validado em modo mock.'
          : `Boletim publicado no backend${response.id ? `: ${response.id}` : '.'}`,
      );
    } catch (error) {
      setPublishState(error instanceof Error ? error.message : 'Falha ao publicar boletim.');
    }
  };

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Etapa 1 · GOES-R/NASA/NOAA</p>
          <h1>SGTR GOES-R Ambiental</h1>
          <p>
            Curadoria de produtos NOAA/NASA/GOES-R para boletins agrometeorologicos do Maranhao.
          </p>
        </div>
        <div className="bbox">
          <span>Recorte tecnico inicial</span>
          <strong>
            {MARANHAO_BBOX.minLat} / {MARANHAO_BBOX.maxLat} lat · {MARANHAO_BBOX.minLon} /{' '}
            {MARANHAO_BBOX.maxLon} lon
          </strong>
        </div>
      </header>

      <TechnicalNotice />

      <section className="panel">
        <div className="section-heading">
          <h2>Produtos ambientais</h2>
          <span>{filteredCatalog.length} produto(s)</span>
        </div>
        <div className="filters" aria-label="Filtros por categoria">
          {categories.map((item) => (
            <button
              className={item === category ? 'filter active' : 'filter'}
              type="button"
              key={item}
              onClick={() => setCategory(item)}
            >
              {CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {filteredCatalog.map((product) => (
            <ProductCard
              product={product}
              key={product.id}
              isSelected={selectedProducts.some((item) => item.id === product.id)}
              isLoading={loadingProductId === product.id}
              onFetchRecent={handleFetchRecent}
              onSelect={selectProduct}
            />
          ))}
        </div>
      </section>

      <RecentProductsPanel
        activeProduct={activeProduct}
        files={recentFiles}
        warning={recentWarning}
        onSelectFile={handleSelectFile}
      />

      <BulletinBuilder
        bulletin={bulletin}
        selectedProducts={selectedProducts}
        publishState={publishState}
        onChange={updateBulletin}
        onGenerate={generateAutomaticText}
        onCopy={copyBulletin}
        onSaveDraft={saveDraft}
        onClear={clearDraft}
        onPublish={handlePublish}
      />

      <SourceLinks />
    </main>
  );
}

export default App;
