import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { buildInfo } from '../../../../../environments/build-info';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss'
})
export class InfoDialogComponent {
  buildTimestamp = buildInfo.timestamp;
  commitHash = buildInfo.commitHash;

  constructor(public dialogRef: MatDialogRef<InfoDialogComponent>) {}

  get formattedDate(): string {
    if (this.buildTimestamp === 'dev') {
      return 'Développement local';
    }
    try {
      const date = new Date(this.buildTimestamp);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris'
      });
    } catch {
      return this.buildTimestamp;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
