import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CsvExportUtil } from '../../../../core/utils/csv-export.util';

/**
 * Composant pour afficher des données JSON sous forme de tableau dynamique
 * Similaire à l'affichage de ChatGPT pour les listes et tableaux
 */
@Component({
  selector: 'app-json-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule, MatSortModule],
  templateUrl: './json-table.component.html',
  styleUrls: ['./json-table.component.scss']
})
export class JsonTableComponent implements OnInit, AfterViewInit {
  @Input() data: any[] = [];
  @Input() highlightedColumns: string[] = [];
  @ViewChild(MatSort) sort!: MatSort;

  /** Set of column names (sans préfixe TABLE.) à mettre en surbrillance */
  private highlightedColumnNames: Set<string> = new Set();

  displayedColumns: string[] = [];
  displayedColumnsWithRowNumber: string[] = [];
  tableData: any[] = [];
  displayedData: any[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  hasMoreData: boolean = false;
  isCollapsed: boolean = true;
  readonly MAX_DISPLAYED_ROWS = 50;
  readonly COLLAPSED_ROWS = 10;

  // Tri manuel
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  ngOnInit(): void {
    this.prepareTableData();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  /**
   * Prépare les données pour l'affichage dans le tableau
   * Détecte automatiquement les colonnes à partir des clés des objets
   */
  private prepareTableData(): void {
    if (!this.data || this.data.length === 0) {
      return;
    }

    // Si c'est un tableau d'objets
    if (Array.isArray(this.data)) {
      this.tableData = this.data;

      // Limiter l'affichage aux 50 premières lignes si nécessaire
      if (this.data.length > this.MAX_DISPLAYED_ROWS) {
        this.displayedData = this.data.slice(0, this.MAX_DISPLAYED_ROWS);
        this.hasMoreData = true;
      } else {
        this.displayedData = this.data;
        this.hasMoreData = false;
      }

      // Gérer le collapse pour les tableaux > 10 lignes
      this.updateVisibleData();

      // Extraire toutes les clés uniques de tous les objets
      const allKeys = new Set<string>();
      this.data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      // Construire le set des noms de colonnes à mettre en surbrillance
      // Le format d'entrée est "TABLE.COLUMN", on extrait le nom de colonne
      this.highlightedColumnNames = new Set(
        this.highlightedColumns.map(col => {
          const parts = col.split('.');
          return parts.length > 1 ? parts[parts.length - 1] : col;
        })
      );

      // Réordonner : colonnes sélectionnées en premier, puis les autres
      const allColumnsArray = Array.from(allKeys);
      if (this.highlightedColumnNames.size > 0) {
        const prioritized = allColumnsArray.filter(col => this.highlightedColumnNames.has(col));
        const rest = allColumnsArray.filter(col => !this.highlightedColumnNames.has(col));
        this.displayedColumns = [...prioritized, ...rest];
      } else {
        this.displayedColumns = allColumnsArray;
      }

      this.displayedColumnsWithRowNumber = ['rowNumber', ...this.displayedColumns];
    }
  }

  /**
   * Met à jour les données visibles en fonction de l'état collapsed
   */
  private updateVisibleData(): void {
    let dataToDisplay: any[];
    if (this.displayedData.length > this.COLLAPSED_ROWS && this.isCollapsed) {
      dataToDisplay = this.displayedData.slice(0, this.COLLAPSED_ROWS);
    } else {
      dataToDisplay = this.displayedData;
    }
    this.dataSource.data = dataToDisplay;
  }

  /**
   * Formate une valeur pour l'affichage
   * Gère les nombres, dates, booléens, etc.
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'number') {
      // Formater les nombres avec séparateurs de milliers
      return value.toLocaleString('fr-FR');
    }

    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    // Détecter et formater les dates
    const dateValue = this.tryParseDate(value);
    if (dateValue) {
      return this.formatDate(dateValue);
    }

    return String(value);
  }

  /**
   * Tente de parser une valeur en date
   * Supporte les formats ISO, timestamps, et autres formats courants
   */
  private tryParseDate(value: any): Date | null {
    if (!value) return null;

    const stringValue = String(value);

    // Format ISO (2024-01-15, 2024-01-15T10:30:00, etc.)
    if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Timestamp (nombre de millisecondes)
    if (typeof value === 'number' && value > 1000000000000) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Format DD/MM/YYYY ou DD-MM-YYYY
    const ddmmyyyyMatch = stringValue.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * Formate une date au format DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formate le nom de la colonne pour l'affichage
   * Convertit SNAKE_CASE en Title Case
   */
  formatColumnName(column: string): string {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Toggle l'état collapsed/expanded du tableau
   */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    // Réappliquer le tri si actif, sinon juste mettre à jour les données visibles
    if (this.sortColumn && this.sortDirection) {
      this.applySorting();
    } else {
      this.updateVisibleData();
    }
  }

  /**
   * Vérifie si le tableau peut être collapsed (> 10 lignes)
   */
  get canCollapse(): boolean {
    return this.displayedData.length > this.COLLAPSED_ROWS;
  }

  /**
   * Retourne le numéro de ligne pour l'affichage
   */
  getRowNumber(index: number): number {
    return index + 1;
  }

  /**
   * Télécharge les données complètes au format CSV
   * Utilise toutes les données (tableData), pas seulement les données affichées
   */
  downloadCSV(): void {
    if (!this.tableData || this.tableData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    // Générer un nom de fichier avec timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `pubgpt-results-${timestamp}.csv`;

    // Utiliser l'utilitaire CSV pour générer et télécharger
    CsvExportUtil.exportToCsv(this.tableData, filename);

    console.log(`Export CSV: ${this.tableData.length} lignes exportées`);
  }


  /**
   * Tri manuel des données
   */
  sortData(column: string): void {
    if (this.sortColumn === column) {
      // Basculer entre asc, desc, et null
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  /**
   * Applique le tri sur les données
   */
  private applySorting(): void {
    let sortedData = [...this.displayedData];

    if (this.sortColumn && this.sortDirection) {
      sortedData.sort((a, b) => {
        const aValue = a[this.sortColumn!];
        const bValue = b[this.sortColumn!];

        // Gérer les valeurs nulles/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Comparer les valeurs
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Appliquer le collapse si nécessaire
    if (sortedData.length > this.COLLAPSED_ROWS && this.isCollapsed) {
      this.dataSource.data = sortedData.slice(0, this.COLLAPSED_ROWS);
    } else {
      this.dataSource.data = sortedData;
    }
  }

  /**
   * Retourne l'icône de tri pour une colonne
   */
  getSortIcon(column: string): string | null {
    if (this.sortColumn !== column) {
      return null;
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Vérifie si une colonne fait partie des colonnes sélectionnées par l'utilisateur
   */
  isHighlighted(column: string): boolean {
    return this.highlightedColumnNames.has(column);
  }
}
