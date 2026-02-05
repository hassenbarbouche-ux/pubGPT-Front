import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

/**
 * Structure d'une colonne sélectionnable
 */
export interface SelectableColumn {
  id: string;
  label: string;
  selected: boolean;
}

/**
 * Structure d'une table avec ses colonnes
 */
export interface TableColumns {
  tableName: string;
  columns: SelectableColumn[];
}

/**
 * Données passées au dialog lors de l'ouverture
 */
export interface ColumnSelectorDialogData {
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
  tables: TableColumns[] = [
    {
      tableName: 'PRODUIT',
      columns: [
        { id: 'PRODUIT.ID_PRODUIT', label: 'ID PRODUIT', selected: false },
        { id: 'PRODUIT.LIBELLE_PRODUIT', label: 'LIBELLE PRODUIT', selected: false },
        { id: 'PRODUIT.CIBLE_PRODUIT', label: 'CIBLE PRODUIT', selected: false },
        { id: 'PRODUIT.TYPE_PRODUIT', label: 'TYPE PRODUIT', selected: false },
        { id: 'PRODUIT.MARQUE', label: 'MARQUE', selected: false }
      ]
    },
    {
      tableName: 'ANNONCEUR',
      columns: [
        { id: 'ANNONCEUR.ID_ANNONCEUR', label: 'ID ANNONCEUR', selected: false },
        { id: 'ANNONCEUR.NUMERO_MANDAT', label: 'NUMERO MANDAT', selected: false },
        { id: 'ANNONCEUR.NOM_ANNONCEUR', label: 'NOM ANNONCEUR', selected: false },
        { id: 'ANNONCEUR.SECTEUR', label: 'SECTEUR', selected: false }
      ]
    },
    {
      tableName: 'BRIEF',
      columns: [
        { id: 'BRIEF.ID_BRIEF', label: 'ID BRIEF', selected: false },
        { id: 'BRIEF.DATE_DEBUT', label: 'DATE DEBUT', selected: false },
        { id: 'BRIEF.DATE_FIN', label: 'DATE FIN', selected: false },
        { id: 'BRIEF.BUDGET', label: 'BUDGET', selected: false }
      ]
    },
    {
      tableName: 'CAMPAGNE',
      columns: [
        { id: 'CAMPAGNE.ID_CAMPAGNE', label: 'ID CAMPAGNE', selected: false },
        { id: 'CAMPAGNE.NOM_CAMPAGNE', label: 'NOM CAMPAGNE', selected: false },
        { id: 'CAMPAGNE.STATUT', label: 'STATUT', selected: false }
      ]
    },
    {
      tableName: 'DIFFUSION',
      columns: [
        { id: 'DIFFUSION.DATE_DIFFUSION', label: 'DATE DIFFUSION', selected: false },
        { id: 'DIFFUSION.CHAINE', label: 'CHAINE', selected: false },
        { id: 'DIFFUSION.HEURE', label: 'HEURE', selected: false },
        { id: 'DIFFUSION.GRP', label: 'GRP', selected: false }
      ]
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<ColumnSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnSelectorDialogData
  ) {
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
