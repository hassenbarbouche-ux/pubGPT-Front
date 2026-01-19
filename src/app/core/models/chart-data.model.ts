/**
 * Types de graphiques supportés
 */
export enum ChartType {
  TIME_SERIES = 'TIME_SERIES',
  BAR = 'BAR',
  HORIZONTAL_BAR = 'HORIZONTAL_BAR',
  PIE = 'PIE',
  STACKED_BAR = 'STACKED_BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  NONE = 'NONE'
}

/**
 * Mapping des dimensions (axes) pour un graphique
 */
export interface ChartDimensions {
  x?: string;
  y?: string;
  series?: string;
  label?: string;
  value?: string;
}

/**
 * Configuration de visualisation pour un graphique
 */
export interface ChartVisualization {
  type: ChartType;
  dimensions: ChartDimensions;
  title: string;
  unit?: string;
  suggestedHeight?: number;
  colorScheme?: string;
}

/**
 * Métadonnées associées à un graphique généré
 */
export interface ChartMetadata {
  rowCount: number;
  hasMoreData: boolean;
  generatedAt?: string;
  reasonForChartType?: string;
}

/**
 * Structure complète des données de visualisation
 */
export interface ChartData {
  visualization: ChartVisualization;
  data: Record<string, any>[];
  metadata: ChartMetadata;
}
