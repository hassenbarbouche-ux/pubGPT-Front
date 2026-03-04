import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Représente une colonne configurable (visibilité + position)
 */
export interface ColumnConfigItem {
  key: string;
  label: string;
  visible: boolean;
  highlighted: boolean;
}

/**
 * Données passées au dialog lors de l'ouverture
 */
export interface ColumnConfigDialogData {
  columns: ColumnConfigItem[];
}

/**
 * Résultat retourné par le dialog
 */
export interface ColumnConfigResult {
  columns: ColumnConfigItem[];
}

/**
 * Dialog de configuration des colonnes du tableau.
 * Permet de réordonner les colonnes par drag & drop et de les afficher/masquer via des toggles.
 */
@Component({
  selector: 'app-column-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './column-config-dialog.component.html',
  styleUrls: ['./column-config-dialog.component.scss']
})
export class ColumnConfigDialogComponent {
  columns: ColumnConfigItem[] = [];

  constructor(
    public dialogRef: MatDialogRef<ColumnConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnConfigDialogData
  ) {
    // Deep copy pour ne pas muter les données d'origine
    this.columns = data.columns.map(col => ({ ...col }));
  }

  /**
   * Retourne le nombre de colonnes visibles
   */
  get visibleCount(): number {
    return this.columns.filter(c => c.visible).length;
  }

  /**
   * Gère le drop après un drag & drop pour réordonner les colonnes
   */
  onDrop(event: CdkDragDrop<ColumnConfigItem[]>): void {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
  }

  /**
   * Bascule la visibilité d'une colonne
   */
  onToggle(column: ColumnConfigItem): void {
    column.visible = !column.visible;
  }

  /**
   * Confirme et retourne la configuration
   */
  onConfirm(): void {
    const result: ColumnConfigResult = {
      columns: this.columns
    };
    this.dialogRef.close(result);
  }

  /**
   * Annule et ferme le dialog
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
