import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ColumnSelectorDialogComponent, ColumnSelectorResult } from '../column-selector-dialog/column-selector-dialog.component';
import { ColumnConfirmDialogComponent, ColumnConfirmDialogResult } from '../column-confirm-dialog/column-confirm-dialog.component';
import { TableWithColumns } from '../../../../core/services/column-discovery.service';
import { GlossaryService } from '../../../../core/services/glossary.service';

export interface QuestionSubmit {
  question: string;
  isChartDemanded: boolean;
  isExplanationDemanded: boolean;
  /** Colonnes sélectionnées par l'utilisateur (optionnel) */
  selectedColumns?: string[];
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
  @Input() userId?: number;
  @Input() sessionId?: string;
  @Output() sendMessage = new EventEmitter<QuestionSubmit>();

  question: string = '';
  isChartDemanded: boolean = false;
  isExplanationDemanded: boolean = false;
  selectedColumns: string[] = [];
  highlightedHtml: SafeHtml = '';

  /** Tables découvertes par l'API (pour réutilisation) */
  private discoveredTables: TableWithColumns[] = [];

  constructor(
    private dialog: MatDialog,
    private glossaryService: GlossaryService,
    private sanitizer: DomSanitizer
  ) {}

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

  onInputChange(): void {
    const raw = this.glossaryService.buildHighlightedHtml(this.question);
    this.highlightedHtml = this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  onPaste(_event: ClipboardEvent): void {
    // Let Angular update the model first, then highlight
    setTimeout(() => this.onInputChange());
  }

  onSend(): void {
    if (this.question.trim() && !this.isInputDisabled) {
      this.sendMessage.emit({
        question: this.question.trim(),
        isChartDemanded: this.isChartDemanded,
        isExplanationDemanded: this.isExplanationDemanded,
        selectedColumns: this.selectedColumns.length > 0 ? this.selectedColumns : undefined
      });
      this.question = '';
      this.highlightedHtml = '';
      // Réinitialiser les colonnes sélectionnées pour la nouvelle question
      this.selectedColumns = [];
      this.discoveredTables = [];
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
   * Si des tables ont déjà été découvertes, ouvre directement le sélecteur
   * Sinon, affiche la popup de confirmation et appelle l'API
   */
  onColumnSelectorClick(): void {
    // Si on a déjà des tables découvertes, ouvrir directement le sélecteur
    if (this.discoveredTables.length > 0) {
      this.openColumnSelector(this.discoveredTables);
      return;
    }

    // Sinon, afficher la popup de confirmation et appeler l'API
    const confirmDialogRef = this.dialog.open(ColumnConfirmDialogComponent, {
      panelClass: 'column-confirm-dialog-panel',
      disableClose: true,
      data: {
        question: this.question.trim(),
        userId: this.userId,
        sessionId: this.sessionId
      }
    });

    confirmDialogRef.afterClosed().subscribe((result: ColumnConfirmDialogResult) => {
      if (result?.confirmed && result.discoveryResponse?.tables) {
        // Sauvegarder les tables découvertes
        this.discoveredTables = result.discoveryResponse.tables;
        // Ouvrir le dialog de sélection avec les données de l'API
        this.openColumnSelector(result.discoveryResponse.tables);
      }
    });
  }

  /**
   * Ouvre le dialog de sélection des colonnes avec les tables découvertes
   */
  openColumnSelector(tables: TableWithColumns[]): void {
    const dialogRef = this.dialog.open(ColumnSelectorDialogComponent, {
      panelClass: 'column-selector-dialog-panel',
      data: {
        discoveredTables: tables,
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
