import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ColumnConfirmDialogData {
  question: string;
}

@Component({
  selector: 'app-column-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './column-confirm-dialog.component.html',
  styleUrls: ['./column-confirm-dialog.component.scss']
})
export class ColumnConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ColumnConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
