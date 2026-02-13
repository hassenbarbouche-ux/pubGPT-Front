import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TokenService } from '../../../../core/services/token.service';
import { ConversationService } from '../../../../core/services/conversation.service';
import { TokenStats } from '../../../../core/models/token-stats.model';
import { ConversationSummary } from '../../../../core/models/conversation.model';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-drawer.component.html',
  styleUrl: './chat-drawer.component.scss'
})
export class ChatDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = true; // Ouvert par défaut
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() chatSelected = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();

  tokenStats: TokenStats | null = null;
  chatHistory: ConversationSummary[] = [];
  isLoadingConversations = false;
  selectedSessionId: string | null = null;
  showUserMenu = false;
  openChatMenuId: string | null = null;
  showProjectSubmenu = false;
  showProjectsList = true;
  private projectSubmenuTimeout: any = null;
  private destroy$ = new Subject<void>();

  // Liste hardcodée des projets disponibles
  availableProjects = [
    { id: '1', name: 'Campagne Peugeot 2024' },
    { id: '2', name: 'Analyse Renault Q1' },
    { id: '3', name: 'Budget Citroën' },
    { id: '4', name: 'Étude Secteur Auto' },
    { id: '5', name: 'Rapport Annuel TV' }
  ];

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private conversationService: ConversationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load initial token stats and conversations
    this.refreshTokenStats();
    this.loadConversations();
  }

  /**
   * Load conversations from backend
   */
  loadConversations(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      console.warn('No user logged in, cannot load conversations');
      return;
    }

    this.isLoadingConversations = true;
    this.conversationService.getUserConversations(currentUser.id, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          // Sort conversations by createdAt descending (most recent first)
          this.chatHistory = conversations.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          this.isLoadingConversations = false;
          console.log(`Loaded ${conversations.length} conversations`);
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.isLoadingConversations = false;
          // Fallback to empty array on error
          this.chatHistory = [];
        }
      });
  }

  /**
   * Refresh token statistics from backend
   * Call this method after each chat response to update the display
   */
  refreshTokenStats(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.tokenService.getUserTokenStats(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.tokenStats = stats;
          },
          error: (error) => {
            console.error('Error fetching token stats:', error);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get the color class for the token bar based on usage percentage
   */
  getTokenBarColorClass(): string {
    if (!this.tokenStats) return 'token-bar-normal';

    const percentage = this.tokenStats.usagePercentage;
    if (percentage >= 90) return 'token-bar-critical';
    if (percentage >= 75) return 'token-bar-warning';
    return 'token-bar-normal';
  }

  /**
   * Get formatted token message
   */
  getTokenMessage(): string {
    if (!this.tokenStats) {
      return 'Chargement...';
    }

    if (this.tokenStats.quotaExceeded) {
      return 'Quota dépassé - Contactez l\'administrateur';
    }

    return `${this.tokenStats.usagePercentage.toFixed(1)}% des tokens utilisés (${this.formatNumber(this.tokenStats.totalTokensConsumed)}/${this.formatNumber(this.tokenStats.maxTokensAllowed)})`;
  }

  /**
   * Format number with thousands separator
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  /**
   * Get the logged in user's login
   */
  getUserLogin(): string {
    const currentUser = this.authService.currentUserValue;
    return currentUser?.login || 'Utilisateur inconnu';
  }

  toggleDrawer(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  closeDrawer(): void {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
  }

  selectChat(sessionId: string): void {
    this.selectedSessionId = sessionId;
    this.chatSelected.emit(sessionId);
    // Ne ferme pas le drawer automatiquement
  }

  createNewChat(): void {
    this.selectedSessionId = null;
    this.newChat.emit();
    // Refresh conversations after creating new chat
    setTimeout(() => this.loadConversations(), 1000);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onConfiguration(): void {
    this.showUserMenu = false;
    // TODO: Implémenter la navigation vers la page de configuration
    console.log('Configuration clicked');
  }

  onLogout(): void {
    this.showUserMenu = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onProjetsSuivis(): void {
    // TODO: Implémenter la navigation vers la page des projets suivis
    console.log('Projets Suivis clicked');
  }

  toggleChatMenu(sessionId: string, event: Event): void {
    event.stopPropagation();
    if (this.openChatMenuId === sessionId) {
      this.openChatMenuId = null;
    } else {
      this.openChatMenuId = sessionId;
    }
  }

  onAssignToProject(sessionId: string): void {
    this.openChatMenuId = null;
    // TODO: Implémenter l'affectation à un projet
    console.log('Assign to project clicked for session:', sessionId);
  }

  onDeleteChat(sessionId: string): void {
    this.openChatMenuId = null;
    // TODO: Implémenter la suppression de conversation
    console.log('Delete chat clicked for session:', sessionId);
    // Example implementation:
    // if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
    //   this.conversationService.deleteConversation(sessionId).subscribe(() => {
    //     this.loadConversations();
    //   });
    // }
  }

  assignChatToProject(sessionId: string, projectId: string): void {
    this.openChatMenuId = null;
    this.showProjectSubmenu = false;
    if (this.projectSubmenuTimeout) {
      clearTimeout(this.projectSubmenuTimeout);
    }
    // TODO: Implémenter l'affectation à un projet
    const project = this.availableProjects.find(p => p.id === projectId);
    console.log(`Assigning chat ${sessionId} to project:`, project?.name);
  }

  onProjectMenuLeave(): void {
    // Petit délai pour permettre à la souris d'atteindre le sous-menu
    this.projectSubmenuTimeout = setTimeout(() => {
      this.showProjectSubmenu = false;
    }, 200);
  }

  onProjectMenuEnter(): void {
    // Annuler le timeout si la souris entre dans le sous-menu
    if (this.projectSubmenuTimeout) {
      clearTimeout(this.projectSubmenuTimeout);
      this.projectSubmenuTimeout = null;
    }
    this.showProjectSubmenu = true;
  }

  toggleProjectsList(): void {
    this.showProjectsList = !this.showProjectsList;
  }

  onProjectClick(projectId: string): void {
    // TODO: Implémenter la navigation vers la page du projet
    const project = this.availableProjects.find(p => p.id === projectId);
    console.log('Project clicked:', project?.name);
  }
}
