export type GoesProductCategory =
  | 'nuvens'
  | 'vapor_agua'
  | 'raios'
  | 'chuva'
  | 'topo_nuvem'
  | 'focos_calor'
  | 'boletim';

export type GoesSource =
  | 'NOAA_GOES_IMAGE_VIEWER'
  | 'NOAA_AWS'
  | 'NASA_WORLDVIEW'
  | 'NOAA_CLASS_AIRS';

export type GoesProduct = {
  id: string;
  title: string;
  category: GoesProductCategory;
  source: GoesSource;
  satellite?: 'GOES-19' | 'GOES-18' | 'GOES-16' | 'GOES-17';
  awsBucket?: string;
  awsProductPrefix?: string;
  viewerUrl?: string;
  worldviewUrl?: string;
  description: string;
  technicalUse: string;
  bulletinUse: string;
  limitations: string;
};

export type SelectedGoesProduct = GoesProduct & {
  selectedAt: string;
  recentFiles?: GoesRecentFile[];
  notes?: string;
};

export type GoesRecentFile = {
  key: string;
  url: string;
  product: string;
  satellite: string;
  bucket: string;
  detectedAt?: string;
};

export type EnvironmentalBulletinStatus =
  | 'draft'
  | 'published'
  | 'archived';

export type EnvironmentalBulletin = {
  id?: string;
  title: string;
  status: EnvironmentalBulletinStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  region: 'Maranhao' | string;
  summary: string;
  technicalText: string;
  limitations: string;
  selectedProducts: SelectedGoesProduct[];
  source: 'sgtr-goes-ambiental';
};
