import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ColumnSelectorDialogComponent, ColumnSelectorResult } from '../column-selector-dialog/column-selector-dialog.component';
import { ColumnConfirmDialogComponent } from '../column-confirm-dialog/column-confirm-dialog.component';

export interface QuestionSubmit {
  question: string;
  isChartDemanded: boolean;
  isExplanationDemanded: boolean;
}

@Component({
  selector: 'app-input-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    TextFieldModule,
    MatDialogModule
  ],
  templateUrl: './input-bar.component.html',
  styleUrl: './input-bar.component.scss'
})
export class InputBarComponent {
  @Input() disabled: boolean = false;
  @Input() maxMessagesReached: boolean = false;
  @Output() sendMessage = new EventEmitter<QuestionSubmit>();

  question: string = '';
  isChartDemanded: boolean = false;
  isExplanationDemanded: boolean = false;
  selectedColumns: string[] = [];

  constructor(private dialog: MatDialog) {}

  get isInputDisabled(): boolean {
    return this.disabled || this.maxMessagesReached;
  }

  /**
   * Vérifie si la question contient au moins 4 mots
   */
  get hasMinimumWords(): boolean {
    const words = this.question.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length >= 4;
  }

  onSend(): void {
    if (this.question.trim() && !this.isInputDisabled) {
      this.sendMessage.emit({
        question: this.question.trim(),
        isChartDemanded: this.isChartDemanded,
        isExplanationDemanded: this.isExplanationDemanded
      });
      this.question = '';
      // Garder les checkboxes cochées pour les prochaines questions
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  /**
   * Gère le clic sur le bouton de sélection des colonnes
   * Affiche d'abord une popup de confirmation avec la question
   */
  onColumnSelectorClick(): void {
    const confirmDialogRef = this.dialog.open(ColumnConfirmDialogComponent, {
      panelClass: 'column-confirm-dialog-panel',
      data: {
        question: this.question.trim()
      }
    });

    confirmDialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.openColumnSelector();
      }
    });
  }

  /**
   * Ouvre le dialog de sélection des colonnes
   */
  openColumnSelector(): void {
    const dialogRef = this.dialog.open(ColumnSelectorDialogComponent, {
      panelClass: 'column-selector-dialog-panel',
      data: {
        preSelectedColumns: this.selectedColumns
      }
    });

    dialogRef.afterClosed().subscribe((result: ColumnSelectorResult | null) => {
      if (result) {
        this.selectedColumns = result.selectedColumns;
      }
    });
  }
}
