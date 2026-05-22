import type { GoesProduct, GoesRecentFile } from '../types/goes';
import { goesCatalog } from './goesCatalog';

export type LatestProductsResponse = {
  ok: boolean;
  satellite: string;
  bucket: string;
  product: string;
  files: GoesRecentFile[];
  warning?: string;
};

const satelliteCode = (satellite?: GoesProduct['satellite']) => {
  if (!satellite) return 'G19';
  return satellite.replace('GOES-', 'G');
};

export async function fetchRecentFiles(product: GoesProduct): Promise<LatestProductsResponse> {
  if (!product.awsProductPrefix) {
    return {
      ok: false,
      satellite: satelliteCode(product.satellite),
      bucket: product.awsBucket ?? '',
      product: product.title,
      warning: 'Produto sem prefixo AWS para busca automatica.',
      files: [],
    };
  }

  const params = new URLSearchParams({
    mode: 'latest',
    satellite: satelliteCode(product.satellite),
    product: product.awsProductPrefix,
  });

  const response = await fetch(`/api/goes-products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Falha ao consultar rota de produtos GOES.');
  }
  return response.json();
}

export function getLocalCatalog() {
  return goesCatalog;
}
