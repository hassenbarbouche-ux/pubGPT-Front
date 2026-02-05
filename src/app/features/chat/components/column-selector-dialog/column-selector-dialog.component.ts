import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TableWithColumns, ColumnInfo } from '../../../../core/services/column-discovery.service';

/**
 * Structure d'une colonne sélectionnable (interne au composant)
 */
export interface SelectableColumn {
  id: string;
  label: string;
  description?: string;
  dataType?: string;
  selected: boolean;
}

/**
 * Structure d'une table avec ses colonnes (interne au composant)
 */
export interface TableColumns {
  tableName: string;
  tableDescription?: string;
  columns: SelectableColumn[];
}

/**
 * Données passées au dialog lors de l'ouverture
 */
export interface ColumnSelectorDialogData {
  /** Tables avec colonnes découvertes par l'API */
  discoveredTables?: TableWithColumns[];
  /** Colonnes pré-sélectionnées (optionnel) */
  preSelectedColumns?: string[];
}

/**
 * Résultat retourné par le dialog
 */
export interface ColumnSelectorResult {
  /** Liste des IDs des colonnes sélectionnées */
  selectedColumns: string[];
}

/**
 * Composant de dialog pour la sélection des colonnes à afficher dans les résultats.
 * Affiche les colonnes groupées par table avec des cases à cocher.
 */
@Component({
  selector: 'app-column-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './column-selector-dialog.component.html',
  styleUrls: ['./column-selector-dialog.component.scss']
})
export class ColumnSelectorDialogComponent {
  /** Terme de recherche */
  searchTerm: string = '';

  /** Tables avec leurs colonnes */
  tables: TableColumns[] = [];

  constructor(
    public dialogRef: MatDialogRef<ColumnSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnSelectorDialogData
  ) {
    // Initialiser les tables depuis les données découvertes par l'API
    if (data?.discoveredTables && data.discoveredTables.length > 0) {
      this.tables = this.convertApiDataToTables(data.discoveredTables);
    } else {
      // Fallback sur des données vides si pas de données de l'API
      console.warn('Aucune table découverte par l\'API');
      this.tables = [];
    }

    // Pré-sélectionner les colonnes si fournies
    if (data?.preSelectedColumns) {
      this.tables.forEach(table => {
        table.columns.forEach(col => {
          if (data.preSelectedColumns!.includes(col.id)) {
            col.selected = true;
          }
        });
      });
    }
  }

  /**
   * Convertit les données de l'API en format interne du composant
   */
  private convertApiDataToTables(apiTables: TableWithColumns[]): TableColumns[] {
    return apiTables.map(apiTable => ({
      tableName: apiTable.tableName,
      tableDescription: apiTable.tableDescription,
      columns: apiTable.columns.map(col => ({
        id: col.id,
        label: col.columnName,
        description: col.description,
        dataType: col.dataType,
        selected: false
      }))
    }));
  }

  /**
   * Retourne le nombre total de colonnes sélectionnées
   */
  get selectedCount(): number {
    return this.tables.reduce((total, table) => {
      return total + table.columns.filter(col => col.selected).length;
    }, 0);
  }

  /**
   * Vérifie si une table doit être affichée selon le terme de recherche
   */
  isTableVisible(table: TableColumns): boolean {
    if (!this.searchTerm.trim()) {
      return true;
    }
    const search = this.searchTerm.toLowerCase().trim();
    // Visible si le nom de la table correspond ou si au moins une colonne correspond
    return table.tableName.toLowerCase().includes(search) ||
           table.columns.some(col => col.label.toLowerCase().includes(search));
  }

  /**
   * Vérifie si une colonne doit être affichée selon le terme de recherche
   */
  isColumnVisible(table: TableColumns, column: SelectableColumn): boolean {
    if (!this.searchTerm.trim()) {
      return true;
    }
    const search = this.searchTerm.toLowerCase().trim();
    // Si le nom de la table correspond, toutes les colonnes sont visibles
    if (table.tableName.toLowerCase().includes(search)) {
      return true;
    }
    // Sinon, vérifier si la colonne correspond
    return column.label.toLowerCase().includes(search);
  }

  /**
   * Efface le terme de recherche
   */
  clearSearch(): void {
    this.searchTerm = '';
  }

  /**
   * Vérifie si toutes les colonnes d'une table sont sélectionnées
   */
  isTableAllSelected(table: TableColumns): boolean {
    return table.columns.every(col => col.selected);
  }

  /**
   * Vérifie si certaines colonnes d'une table sont sélectionnées (état indéterminé)
   */
  isTablePartiallySelected(table: TableColumns): boolean {
    const selectedCount = table.columns.filter(col => col.selected).length;
    return selectedCount > 0 && selectedCount < table.columns.length;
  }

  /**
   * Toggle toutes les colonnes d'une table
   */
  toggleTable(table: TableColumns): void {
    const newState = !this.isTableAllSelected(table);
    table.columns.forEach(col => col.selected = newState);
  }

  /**
   * Réinitialiser toutes les sélections
   */
  onReset(): void {
    this.tables.forEach(table => {
      table.columns.forEach(col => col.selected = false);
    });
  }

  /**
   * Annuler et fermer le dialog
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Confirmer et retourner les colonnes sélectionnées
   */
  onConfirm(): void {
    const selectedColumns: string[] = [];

    this.tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.selected) {
          selectedColumns.push(col.id);
        }
      });
    });

    const result: ColumnSelectorResult = {
      selectedColumns
    };

    this.dialogRef.close(result);
  }
}
