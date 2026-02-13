import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ChartData, ChartType } from '../../../../core/models';

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './chart-renderer.component.html',
  styleUrl: './chart-renderer.component.scss'
})
export class ChartRendererComponent implements OnInit {
  @Input() chartData!: ChartData;

  // Enum accessible dans le template
  ChartType = ChartType;

  // Configuration du graphique
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false; // Légende désactivée
  showXAxisLabel = true;
  showYAxisLabel = true;
  xAxisLabel = '';
  yAxisLabel = '';
  colorScheme: any;
  animations = true; // Active les animations NGX-Charts

  // Données formatées pour NGX-Charts
  chartDataFormatted: any[] = [];

  constructor() {}

  ngOnInit(): void {
    if (!this.chartData || !this.chartData.visualization) {
      console.error('ChartData is missing or invalid');
      return;
    }

    // Configurer les labels
    this.xAxisLabel = this.chartData.visualization.dimensions.x ||
                      this.chartData.visualization.dimensions.label || '';
    this.yAxisLabel = this.chartData.visualization.unit ||
                      this.chartData.visualization.dimensions.y || '';

    // Configurer le thème grayscale
    this.colorScheme = this.getGrayscaleTheme();

    // La largeur est undefined pour permettre au graphique d'être responsive
    // Il prendra automatiquement toute la largeur du container parent

    // Formater les données selon le type de graphique
    this.formatChartData();
  }

  /**
   * Formate les données selon le type de graphique NGX-Charts
   */
  private formatChartData(): void {
    const type = this.chartData.visualization.type;
    const data = this.chartData.data;
    const dims = this.chartData.visualization.dimensions;

    switch (type) {
      case ChartType.PIE:
        this.chartDataFormatted = this.formatPieData(data, dims);
        this.showXAxis = false;
        this.showYAxis = false;
        break;

      case ChartType.BAR:
      case ChartType.HORIZONTAL_BAR:
        this.chartDataFormatted = this.formatBarData(data, dims);
        break;

      case ChartType.TIME_SERIES:
      case ChartType.LINE:
      case ChartType.AREA:
        this.chartDataFormatted = this.formatTimeSeriesData(data, dims);
        break;

      case ChartType.STACKED_BAR:
        this.chartDataFormatted = this.formatStackedBarData(data, dims);
        break;

      default:
        console.error('Unsupported chart type:', type);
    }
  }

  /**
   * Format pour PIE chart : [{ name: string, value: number }]
   */
  private formatPieData(data: any[], dims: any): any[] {
    const labelKey = dims.label || dims.x;
    const valueKey = dims.value || dims.y;

    return data.map(row => ({
      name: row[labelKey]?.toString() || 'N/A',
      value: parseFloat(row[valueKey]) || 0
    }));
  }

  /**
   * Format pour BAR chart : [{ name: string, value: number }]
   */
  private formatBarData(data: any[], dims: any): any[] {
    const xKey = dims.x;
    const yKey = dims.y;

    return data.map(row => ({
      name: row[xKey]?.toString() || 'N/A',
      value: parseFloat(row[yKey]) || 0
    }));
  }

  /**
   * Format pour TIME_SERIES / LINE / AREA :
   * [{ name: 'Series', series: [{ name: date, value: number }] }]
   */
  private formatTimeSeriesData(data: any[], dims: any): any[] {
    const xKey = dims.x;
    const yKey = dims.y;

    const series = data.map(row => ({
      name: row[xKey]?.toString() || 'N/A',
      value: parseFloat(row[yKey]) || 0
    }));

    return [{
      name: this.yAxisLabel || 'Valeur',
      series: series
    }];
  }

  /**
   * Format pour STACKED_BAR :
   * [{ name: 'Category', series: [{ name: 'SubCategory', value: number }] }]
   */
  private formatStackedBarData(data: any[], dims: any): any[] {
    // Grouper par série si dims.series est fourni
    if (!dims.series) {
      return this.formatBarData(data, dims);
    }

    const grouped = new Map<string, any[]>();
    const xKey = dims.x;
    const yKey = dims.y;
    const seriesKey = dims.series;

    data.forEach(row => {
      const category = row[xKey]?.toString() || 'N/A';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push({
        name: row[seriesKey]?.toString() || 'N/A',
        value: parseFloat(row[yKey]) || 0
      });
    });

    return Array.from(grouped.entries()).map(([name, series]) => ({
      name,
      series
    }));
  }

  /**
   * Thème grayscale pour NGX-Charts
   */
  private getGrayscaleTheme(): any {
    return {
      domain: [
        '#1a1a1a',  // Noir
        '#404040',  // Gris foncé
        '#666666',  // Gris moyen
        '#999999',  // Gris clair
        '#cccccc',  // Gris très clair
        '#e5e5e5'   // Presque blanc
      ]
    };
  }

  /**
   * Formateur personnalisé pour les valeurs avec unité
   */
  valueFormatting = (value: number): string => {
    const unit = this.chartData?.visualization?.unit || '';
    if (unit === '€') {
      return `${value.toLocaleString('fr-FR')} €`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('fr-FR');
  };

  /**
   * Formateur pour les labels de l'axe X (dates)
   */
  xAxisFormatting = (value: any): string => {
    // Si c'est une date ISO string, la parser et formater en DD/MM/YYYY
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    // Si c'est déjà un objet Date
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return value?.toString() || '';
  };
}
