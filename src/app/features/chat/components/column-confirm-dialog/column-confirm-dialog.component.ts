import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ColumnDiscoveryService, ColumnDiscoveryResponse } from '../../../../core/services/column-discovery.service';

export interface ColumnConfirmDialogData {
  question: string;
  userId?: number;
  sessionId?: string;
}

/**
 * Résultat retourné par le dialog de confirmation
 */
export interface ColumnConfirmDialogResult {
  confirmed: boolean;
  discoveryResponse?: ColumnDiscoveryResponse;
  error?: string;
}

@Component({
  selector: 'app-column-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './column-confirm-dialog.component.html',
  styleUrls: ['./column-confirm-dialog.component.scss']
})
export class ColumnConfirmDialogComponent {
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ColumnConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnConfirmDialogData,
    private columnDiscoveryService: ColumnDiscoveryService
  ) {}

  onCancel(): void {
    const result: ColumnConfirmDialogResult = { confirmed: false };
    this.dialogRef.close(result);
  }

  onConfirm(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Appeler l'API de découverte des colonnes
    this.columnDiscoveryService.discoverColumns({
      question: this.data.question,
      userId: this.data.userId,
      sessionId: this.data.sessionId
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          const result: ColumnConfirmDialogResult = {
            confirmed: true,
            discoveryResponse: response
          };
          this.dialogRef.close(result);
        } else {
          // Erreur métier (pas SQL_SEARCH, etc.)
          this.errorMessage = response.errorMessage || 'Une erreur est survenue';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors de la découverte des colonnes:', error);
        this.errorMessage = 'Impossible de contacter le serveur. Veuillez réessayer.';
      }
    });
  }
}
