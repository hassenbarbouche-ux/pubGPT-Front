import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SqlDialogData {
  sql: string;
  tables?: string[];
  executionTime?: number;
}

@Component({
  selector: 'app-sql-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './sql-dialog.component.html',
  styleUrl: './sql-dialog.component.scss'
})
export class SqlDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SqlDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SqlDialogData
  ) {}

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.data.sql).then(() => {
      // Optionnel: afficher un snackbar de confirmation
      console.log('SQL copié dans le presse-papiers');
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
