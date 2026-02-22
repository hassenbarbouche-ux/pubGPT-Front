import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

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
export class HeaderBarComponent implements OnChanges, OnInit {
  @Input() confidenceScore: number | null = null;
  @Input() confidenceLevel: string | null = null;
  @Input() executionTime: number | null = null;
  @Input() hasSql: boolean = false;
  @Input() userAccess: string = 'Full Access';
  @Input() tokenUsagePercent: number = 37;
  @Input() requestCount: number | null = null;
  @Input() accuracy: number | null = null;
  @Input() sqlQuery: string | null = null;
  @Input() sqlTables: string[] = [];
  @Input() sqlExecutionTime: number | null = null;

  @Output() sqlClick = new EventEmitter<void>();
  @Output() emailClick = new EventEmitter<void>();
  @Output() menuClick = new EventEmitter<void>();

  showAccuracyTooltip: boolean = false;
  showSqlTooltip: boolean = false;
  private previousAccuracy: number | null = null;

  isDemoUser: boolean = false;
  tokensUsed: number = 0;
  tokenQuota: number = 0;
  isDarkTheme: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.isDemoUser = this.authService.isDemoUser();
    this.updateTokenInfo();

    this.authService.currentUser$.subscribe(() => {
      this.updateTokenInfo();
    });

    this.themeService.theme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
    });
  }

  onToggleTheme(): void {
    this.themeService.toggle();
  }

  private updateTokenInfo(): void {
    const quota = this.authService.getTokenQuota();
    if (quota) {
      this.tokensUsed = quota.tokensUsed;
      this.tokenQuota = quota.tokenQuota;
    }
  }

  formatTokens(n: number): string {
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }

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

  getTokenUsageMessage(): string {
    return `Vous avez utilisé ${this.tokenUsagePercent}% de vos tokens`;
  }

  getTokenBarColor(): string {
    if (this.tokenUsagePercent >= 80) return '#000000'; // Black
    if (this.tokenUsagePercent >= 50) return '#4A4A4A'; // Dark gray
    return '#2F2F2F'; // Medium gray
  }

  onSqlClick(): void {
    if (this.hasSql && this.sqlQuery) {
      this.showSqlTooltip = !this.showSqlTooltip;
    }
  }

  copySqlToClipboard(): void {
    if (this.sqlQuery) {
      navigator.clipboard.writeText(this.sqlQuery).then(() => {
        console.log('SQL copié dans le presse-papiers');
      });
    }
  }

  onEmailClick(): void {
    this.emailClick.emit();
  }

  onMenuClick(): void {
    this.menuClick.emit();
  }

  ngOnChanges(): void {
    // Détecter quand accuracy change et afficher la bulle
    if (this.accuracy !== null && this.accuracy !== this.previousAccuracy) {
      this.showAccuracyTooltip = true;
      this.previousAccuracy = this.accuracy;

      // Cacher la bulle après 5 secondes
      setTimeout(() => {
        this.showAccuracyTooltip = false;
      }, 5000);
    }
  }

  getAccuracySmiley(): string {
    if (!this.accuracy) return '😐';
    if (this.accuracy >= 80) return '😊';
    if (this.accuracy >= 60) return '🙂';
    if (this.accuracy >= 40) return '😐';
    return '😕';
  }

  getAccuracyMessage(): string {
    if (!this.accuracy) return 'Aucune donnée disponible';
    if (this.accuracy >= 80) return 'Excellente précision ! Vous pouvez faire confiance à ce résultat.';
    if (this.accuracy >= 60) return 'Bonne précision. Le résultat est fiable.';
    if (this.accuracy >= 40) return 'Précision moyenne. Vérifiez les résultats importants.';
    return 'Précision faible. Soyez prudent avec ce résultat.';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
