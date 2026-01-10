import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './header-bar.component.html',
  styleUrl: './header-bar.component.scss'
})
export class HeaderBarComponent {
  @Input() confidenceScore: number | null = null;
  @Input() confidenceLevel: string | null = null;
  @Input() executionTime: number | null = null;
  @Input() hasSql: boolean = false;
  @Input() userAccess: string = 'FULL ACCESS';

  @Output() sqlClick = new EventEmitter<void>();
  @Output() emailClick = new EventEmitter<void>();

  getConfidenceColor(): string {
    if (!this.confidenceScore) return 'accent';
    if (this.confidenceScore >= 90) return 'primary';
    if (this.confidenceScore >= 70) return 'accent';
    return 'warn';
  }

  getConfidenceLevelText(): string {
    switch (this.confidenceLevel) {
      case 'TRES_ELEVE': return 'Très élevé';
      case 'ELEVE': return 'Élevé';
      case 'MOYEN': return 'Moyen';
      case 'FAIBLE': return 'Faible';
      default: return '-';
    }
  }

  formatExecutionTime(): string {
    if (!this.executionTime) return '-';
    return this.executionTime < 1000
      ? `${this.executionTime}ms`
      : `${(this.executionTime / 1000).toFixed(1)}s`;
  }

  onSqlClick(): void {
    if (this.hasSql) {
      this.sqlClick.emit();
    }
  }

  onEmailClick(): void {
    this.emailClick.emit();
  }
}
