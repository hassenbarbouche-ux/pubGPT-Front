import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Composant pour afficher des données JSON sous forme de tableau dynamique
 * Similaire à l'affichage de ChatGPT pour les listes et tableaux
 */
@Component({
  selector: 'app-json-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './json-table.component.html',
  styleUrls: ['./json-table.component.scss']
})
export class JsonTableComponent implements OnInit {
  @Input() data: any[] = [];

  displayedColumns: string[] = [];
  displayedColumnsWithRowNumber: string[] = [];
  tableData: any[] = [];
  displayedData: any[] = [];
  visibleData: any[] = [];
  hasMoreData: boolean = false;
  isCollapsed: boolean = true;
  readonly MAX_DISPLAYED_ROWS = 50;
  readonly COLLAPSED_ROWS = 10;

  ngOnInit(): void {
    this.prepareTableData();
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

      this.displayedColumns = Array.from(allKeys);
      this.displayedColumnsWithRowNumber = ['rowNumber', ...this.displayedColumns];
    }
  }

  /**
   * Met à jour les données visibles en fonction de l'état collapsed
   */
  private updateVisibleData(): void {
    if (this.displayedData.length > this.COLLAPSED_ROWS && this.isCollapsed) {
      this.visibleData = this.displayedData.slice(0, this.COLLAPSED_ROWS);
    } else {
      this.visibleData = this.displayedData;
    }
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

    return String(value);
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
    this.updateVisibleData();
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
   * TODO: Implémenter la génération CSV réelle
   */
  downloadCSV(): void {
    // Pour l'instant, c'est un lien factice
    console.log('Téléchargement CSV à implémenter - Total rows:', this.tableData.length);
    // TODO: Générer un vrai fichier CSV avec toutes les données
  }
}
