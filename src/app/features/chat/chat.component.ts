import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ConversationService } from '../../core/services/conversation.service';
import { ChatMessage, ChatResponse, StreamEvent } from '../../core/models';
import { initChecklistState, getChecklistItemFromEvent, ChecklistItemState } from '../../core/models/checklist.model';
import { AmbiguityResponse, ClarificationContext } from '../../core/models/ambiguity.model';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { InputBarComponent, QuestionSubmit } from './components/input-bar/input-bar.component';
import { ChatDrawerComponent } from './components/chat-drawer/chat-drawer.component';
import {
  ClarificationDialogComponent,
  ClarificationDialogData
} from './components/clarification-dialog/clarification-dialog.component';
import { OnboardingTourComponent } from './components/onboarding-tour/onboarding-tour.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    HeaderBarComponent,
    MessageListComponent,
    InputBarComponent,
    ChatDrawerComponent,
    MatDialogModule,
    ClarificationDialogComponent,
    OnboardingTourComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chatDrawer') chatDrawer!: ChatDrawerComponent;
  @ViewChild('onboardingTour') onboardingTour!: OnboardingTourComponent;

  messages: ChatMessage[] = [];
  isProcessing: boolean = false;
  sessionId: string | null = null;
  lastResponse: ChatResponse | null = null;
  isDrawerOpen: boolean = true; // Drawer ouvert par défaut
  isDemoUser: boolean = false;
  demoSelectedQuestion: string = '';

  private subscription?: Subscription;

  // ✅ FIX: Stocker les flags pour les préserver après ambiguïté
  private currentIsChartDemanded: boolean = false;
  private currentIsExplanationDemanded: boolean = false;
  private currentSelectedColumns: string[] = [];

  // Limite de messages (5 questions utilisateur max)
  readonly MAX_USER_MESSAGES = 5;

  get userMessageCount(): number {
    return this.messages.filter(m => m.role === 'user').length;
  }

  get isMaxMessagesReached(): boolean {
    return this.userMessageCount >= this.MAX_USER_MESSAGES;
  }

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private conversationService: ConversationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isDemoUser = this.authService.isDemoUser();

    // Optionnel: vérifier la santé du backend
    this.chatService.healthCheck().subscribe({
      next: (response) => console.log('Backend health:', response),
      error: (error) => console.error('Backend health check failed:', error)
    });
  }

  ngAfterViewInit(): void {
    if (this.authService.shouldShowTour) {
      this.authService.shouldShowTour = false;
      setTimeout(() => this.onboardingTour.start(), 600);
    }
  }

  onTourCompleted(): void {
    console.log('Onboarding tour completed');
  }

  onDemoQuestionSelect(question: string): void {
    this.demoSelectedQuestion = question;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSendMessage(questionSubmit: QuestionSubmit | string): void {
    // Support pour les deux formats (ancien string et nouveau QuestionSubmit)
    const question = typeof questionSubmit === 'string' ? questionSubmit : questionSubmit.question;
    const isChartDemanded = typeof questionSubmit === 'string' ? false : questionSubmit.isChartDemanded;
    const isExplanationDemanded = typeof questionSubmit === 'string' ? false : (questionSubmit.isExplanationDemanded || false);
    const selectedColumns = typeof questionSubmit === 'string' ? [] : (questionSubmit.selectedColumns || []);

    // ✅ FIX: Stocker les flags pour les préserver après ambiguïté
    this.currentIsChartDemanded = isChartDemanded;
    this.currentIsExplanationDemanded = isExplanationDemanded;
    this.currentSelectedColumns = selectedColumns;

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    this.isProcessing = true;

    // Récupérer l'utilisateur connecté
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      console.error('User not authenticated');
      return;
    }

    // Créer une référence pour le message assistant qui sera créé plus tard
    let assistantMessage: ChatMessage | null = null;

    console.log('Options:', { isChartDemanded, isExplanationDemanded, selectedColumns });

    // Appeler le service SSE avec userId, isChartDemanded, isExplanationDemanded et selectedColumns
    this.subscription = this.chatService.streamChat(question, currentUser.id, this.sessionId ?? undefined, isChartDemanded, isExplanationDemanded, selectedColumns.length > 0 ? selectedColumns : undefined).subscribe({
      next: (event: StreamEvent) => {
        console.log('SSE Event received:', {
          step: event.step,
          message: event.message,
          hasData: !!event.data,
          dataKeys: event.data ? Object.keys(event.data) : []
        });

        // Gérer la session créée sans créer de bulle
        if (event.step === 'session_created') {
          if (event.data?.sessionId) {
            this.sessionId = event.data.sessionId;
          }
          console.log('Session created, skipping bubble creation');
          return;
        }

        // Créer le message assistant au premier événement (sauf session_created)
        // pour afficher les étapes de progression
        if (!assistantMessage) {
          console.log('Creating assistant bubble for:', event.step);
          assistantMessage = {
            id: this.generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            streamingSteps: [],
            checklistState: initChecklistState()
          };
          this.messages.push(assistantMessage);
        }

        // Traiter l'événement
        this.handleStreamEvent(event, assistantMessage);
      },
      error: (error) => {
        console.error('Erreur SSE:', error);
        if (!assistantMessage) {
          assistantMessage = {
            id: this.generateId(),
            role: 'assistant',
            content: 'Désolé, une erreur est survenue lors du traitement de votre question.',
            timestamp: new Date(),
            isStreaming: false
          };
          this.messages.push(assistantMessage);
        } else {
          assistantMessage.content = 'Désolé, une erreur est survenue lors du traitement de votre question.';
          assistantMessage.isStreaming = false;
        }
        this.isProcessing = false;
      },
      complete: () => {
        if (assistantMessage) {
          assistantMessage.isStreaming = false;
        }
        this.isProcessing = false;

        // Refresh token stats, quota, and conversation list immediately after response
        if (this.chatDrawer) {
          this.chatDrawer.refreshTokenStats();
          this.chatDrawer.loadConversations();
        }
        // Rafraîchir le quota tokens pour les demo users
        this.authService.refreshQuota();
      }
    });
  }

  private handleStreamEvent(event: StreamEvent, message: ChatMessage): void {
    console.log('SSE Event:', event);

    // Mettre à jour les étapes de progression (sauf pour session_created et ambiguity_detected)
    if (event.step !== 'result' && event.step !== 'error' && event.step !== 'session_created' && event.step !== 'ambiguity_detected') {
      if (!message.streamingSteps) {
        message.streamingSteps = [];
      }
      message.streamingSteps.push(event.message);
    }

    // Mettre à jour l'état de la checklist
    this.updateChecklistState(event, message);

    // Gérer l'événement de session créée
    if (event.step === 'session_created' && event.data?.sessionId) {
      this.sessionId = event.data.sessionId;
    }

    // Gérer l'événement d'ambiguïté détectée (SSE streaming)
    if (event.step === 'ambiguity_detected' && event.data) {
      const ambiguityResponse = event.data as AmbiguityResponse;
      console.log('🔍 Ambiguïté détectée (SSE):', ambiguityResponse);

      // Récupérer la question originale depuis le dernier message utilisateur
      const userMessages = this.messages.filter(m => m.role === 'user');
      const originalQuestion = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

      // Ouvrir le dialog de clarification
      this.openClarificationDialog(ambiguityResponse, originalQuestion);

      // Supprimer le message assistant de la liste
      const index = this.messages.indexOf(message);
      if (index > -1) {
        this.messages.splice(index, 1);
      }
      this.isProcessing = false;
      return;
    }

    // Gérer le résultat final
    if (event.step === 'result' && event.data) {
      const response: ChatResponse = event.data;

      // Vérifier si ambiguïté détectée (cas POST non-streaming)
      if (response.ambiguityDetected?.hasAmbiguity) {
        console.log('🔍 Ambiguïté détectée (POST):', response.ambiguityDetected);

        // Récupérer la question originale
        const userMessages = this.messages.filter(m => m.role === 'user');
        const originalQuestion = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

        // Ouvrir le dialog de clarification
        this.openClarificationDialog(
          response.ambiguityDetected,
          originalQuestion
        );

        // Supprimer le message assistant de la liste
        const index = this.messages.indexOf(message);
        if (index > -1) {
          this.messages.splice(index, 1);
        }
        this.isProcessing = false;
        return;
      }

      // Traiter la réponse normale
      message.response = response;
      this.lastResponse = response;
      this.sessionId = response.sessionId;

      // Attacher les colonnes sélectionnées au message pour le highlighting
      if (this.currentSelectedColumns.length > 0) {
        message.selectedColumns = [...this.currentSelectedColumns];
      }

      // Détecter et extraire les données JSON pour affichage en tableau
      if (response.subResponses && response.subResponses.length > 0) {
        // Multi-tableaux : stocker les sub-responses, pas de jsonData unique
        message.subResponses = response.subResponses;
        message.hasJsonData = false;
        const cleanedAnswer = this.removeJsonFromAnswer(response.answer);
        message.content = cleanedAnswer;
      } else if (response.queryResults && Array.isArray(response.queryResults) && response.queryResults.length > 0) {
        message.hasJsonData = true;
        message.jsonData = response.queryResults;
        // Supprimer le JSON de la réponse textuelle si présent
        console.log('Original answer:', response.answer);
        const cleanedAnswer = this.removeJsonFromAnswer(response.answer);
        console.log('Cleaned answer:', cleanedAnswer);
        message.content = cleanedAnswer;
      } else {
        message.content = response.answer;
      }
    }

    // Gérer les erreurs
    if (event.step === 'error') {
      message.content = `Erreur: ${event.message}`;
    }
  }

  onEmailClick(): void {
    if (this.lastResponse) {
      const subject = 'Résultat pubGPT';
      const body = `Question: ${this.messages[this.messages.length - 2]?.content}\n\nRéponse: ${this.lastResponse.answer}\n\nSQL: ${this.lastResponse.generatedSql || 'N/A'}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }

  /**
   * Met à jour l'état de la checklist en fonction de l'événement SSE reçu
   */
  private updateChecklistState(event: StreamEvent, message: ChatMessage): void {
    if (!message.checklistState) {
      message.checklistState = initChecklistState();
    }

    // Ignorer session_created et error
    if (event.step === 'session_created' || event.step === 'error') {
      return;
    }

    // ========== Thinking stream events ==========
    if (event.step === 'thinking_stream') {
      if (event.data?.type === 'chunk') {
        message.thinkingText = (message.thinkingText || '') + event.message;
        message.isThinkingActive = true;
      } else if (event.data?.type === 'complete') {
        message.isThinkingActive = false;
      }
      return;
    }

    // Gérer l'événement planner_requested (début du planner)
    if (event.step === 'planner_requested' || event.step === 'planner_execution') {
      message.isPlannerVisible = true;
      message.checklistState.set('sql_generation', 'in_progress');
      console.log(`🔵 Planner started: isPlannerVisible = true`);
      return;
    }

    // Gérer les événements du Planner (planner_strategy, planner_thinking, planner_synthesis)
    if (event.step.startsWith('planner_') && event.data?.phase && event.data?.status) {
      const plannerPhase = event.data.phase as string;
      const plannerStatus = event.data.status as 'in_progress' | 'completed';

      // Activer la visibilité du planner
      message.isPlannerVisible = true;

      // Mettre à jour l'état du sous-item du planner
      message.checklistState.set(plannerPhase, plannerStatus);

      // S'assurer que sql_generation est en in_progress quand le planner est actif
      if (plannerStatus === 'in_progress') {
        message.checklistState.set('sql_generation', 'in_progress');
      }

      console.log(`🔵 Planner event: ${plannerPhase} -> ${plannerStatus}`);
      return;
    }

    // Gérer planner_completed
    if (event.step === 'planner_completed') {
      // Marquer tous les sous-items comme completed
      message.checklistState.set('planner_strategy', 'completed');
      message.checklistState.set('planner_thinking', 'completed');
      message.checklistState.set('planner_synthesis', 'completed');
      console.log(`🔵 Planner completed`);
      return;
    }

    // ========== Orchestrator events ==========

    // Entrée en mode orchestrateur : masquer sql_generation, activer orchestration
    if (event.step === 'orchestrator') {
      message.isOrchestratorVisible = true;
      message.checklistState.set('sql_generation', 'skipped');
      message.checklistState.set('orchestration', 'in_progress');
      console.log(`🎭 Orchestrator started`);
      return;
    }

    // Reasoning de l'orchestrateur : mettre à jour le texte affiché
    if (event.step === 'orchestrator_reasoning') {
      message.isOrchestratorVisible = true;
      message.orchestratorReasoning = event.data?.reasoning || event.message;
      message.checklistState.set('orchestration', 'in_progress');
      console.log(`🎭 Orchestrator reasoning: ${message.orchestratorReasoning?.substring(0, 80)}...`);
      return;
    }

    // Plan de l'orchestrateur : le plan est arrivé, on reste in_progress
    if (event.step === 'orchestrator_plan') {
      message.isOrchestratorVisible = true;
      message.checklistState.set('orchestration', 'in_progress');
      console.log(`🎭 Orchestrator plan received: ${event.data?.totalStepsEstimated} steps`);
      return;
    }

    // Thinking/Task de l'orchestrateur : rester in_progress
    if (event.step === 'orchestrator_thinking' || event.step === 'orchestrator_task') {
      message.checklistState.set('orchestration', 'in_progress');
      return;
    }

    // Synthèse : orchestration terminée
    if (event.step === 'orchestrator_synthesis') {
      message.checklistState.set('orchestration', 'completed');
      message.orchestratorReasoning = event.message;
      console.log(`🎭 Orchestrator synthesis`);
      return;
    }

    // Trouver l'item de checklist correspondant à cet événement
    const checklistItem = getChecklistItemFromEvent(event.step);
    if (!checklistItem) {
      return;
    }

    // Déterminer le nouvel état
    let newState: ChecklistItemState;

    // Les événements *_result, result, et *_success indiquent la complétion
    if (event.step.endsWith('_result') || event.step.endsWith('_success') || event.step === 'result') {
      newState = 'completed';
    } else {
      // Les autres événements indiquent "in_progress"
      newState = 'in_progress';
    }

    // Mettre à jour l'état
    message.checklistState.set(checklistItem.id, newState);
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Ouvre le dialog de clarification et gère la réponse utilisateur.
   */
  private openClarificationDialog(
    ambiguityResponse: AmbiguityResponse,
    originalQuestion: string
  ): void {
    const dialogRef = this.dialog.open(ClarificationDialogComponent, {
      data: {
        questions: ambiguityResponse.questions,
        isChartDemanded: this.currentIsChartDemanded,  // ✅ FIX: Passer les flags
        isExplanationDemanded: this.currentIsExplanationDemanded
      } as ClarificationDialogData,
      width: '600px',
      disableClose: true,  // Empêcher fermeture en cliquant à l'extérieur
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((clarificationContext: ClarificationContext | null) => {
      if (clarificationContext) {
        // User a confirmé → Relancer la requête avec le contexte
        console.log('✅ Clarifications reçues:', clarificationContext);
        this.resendMessageWithClarification(originalQuestion, clarificationContext);
      } else {
        // User a annulé → Réinitialiser l'état
        console.log('❌ Clarification annulée');
        this.isProcessing = false;
      }
    });
  }

  /**
   * Renvoie la question originale avec le contexte de clarification.
   *
   * ✅ FIX: Utilise maintenant streamChatWithClarification() (SSE) au lieu de
   * sendMessageWithClarification() (POST) pour éviter le problème de routage
   * vers ChatOrchestrationService.
   */
  private resendMessageWithClarification(
    question: string,
    clarificationContext: ClarificationContext
  ): void {
    this.isProcessing = true;

    // Créer le message assistant pour la réponse
    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      streamingSteps: [],
      checklistState: initChecklistState()
    };

    this.messages.push(assistantMessage);

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      console.error('❌ User ID manquant');
      assistantMessage.content = 'Erreur: Utilisateur non authentifié';
      assistantMessage.isStreaming = false;
      this.isProcessing = false;
      return;
    }

    // ✅ FIX: Récupérer les flags depuis le clarificationContext
    const isChartDemanded = clarificationContext.isChartDemanded ?? false;
    const isExplanationDemanded = clarificationContext.isExplanationDemanded ?? false;

    console.log('🔄 [SSE] Envoi avec clarifications via SSE:', { question, clarificationContext });

    // ✅ FIX: Utiliser streamChatWithClarification (SSE) au lieu de sendMessageWithClarification (POST)
    this.subscription = this.chatService.streamChatWithClarification(
      question,
      currentUser.id,
      clarificationContext,
      this.sessionId ?? undefined,
      isChartDemanded,
      isExplanationDemanded,
      this.currentSelectedColumns.length > 0 ? this.currentSelectedColumns : undefined
    ).subscribe({
      next: (event: StreamEvent) => {
        console.log('🔄 [SSE] Event reçu après clarification:', event.step);

        // Gérer la session créée sans créer de bulle
        if (event.step === 'session_created') {
          if (event.data?.sessionId) {
            this.sessionId = event.data.sessionId;
          }
          return;
        }

        // Traiter l'événement
        this.handleStreamEvent(event, assistantMessage);
      },
      error: (error) => {
        console.error('❌ Erreur SSE lors de l\'envoi avec clarifications:', error);
        assistantMessage.content = 'Une erreur est survenue lors du traitement de votre demande.';
        assistantMessage.isStreaming = false;
        this.isProcessing = false;
      },
      complete: () => {
        assistantMessage.isStreaming = false;
        this.isProcessing = false;

        // Refresh token stats, quota, and conversation list
        if (this.chatDrawer) {
          this.chatDrawer.refreshTokenStats();
          this.chatDrawer.loadConversations();
        }
        this.authService.refreshQuota();
      }
    });
  }

  onChatSelected(sessionId: string): void {
    console.log('Loading conversation:', sessionId);

    // Charger la conversation complète avec tous les résultats
    this.conversationService.getConversation(sessionId, true).subscribe({
      next: (conversation) => {
        console.log('Conversation loaded:', conversation);

        // Réinitialiser l'état
        this.messages = [];
        this.sessionId = conversation.sessionId;
        this.lastResponse = null;

        // Convertir les messages de la conversation en ChatMessage
        conversation.messages.forEach(msg => {
          const chatMessage: ChatMessage = {
            id: msg.messageId,
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          };

          // Pour les messages assistant, ajouter le contexte (SQL, résultats, graphiques)
          if (msg.role === 'ASSISTANT' && msg.context) {
            console.log('Processing ASSISTANT message:', {
              messageId: msg.messageId,
              hasContext: !!msg.context,
              hasChartData: !!msg.context.chartData,
              chartData: msg.context.chartData
            });

            // Créer un objet ChatResponse pour stocker toutes les infos
            const response: ChatResponse = {
              sessionId: conversation.sessionId,
              answer: msg.content,
              generatedSql: msg.context.generatedSql || null,
              queryResults: msg.context.queryResults || null,
              metadata: {
                intent: msg.context.intent || '',
                identifiedTables: msg.context.identifiedTables || [],
                identifiedColumns: msg.context.resultColumns || [],
                identifiedWorkspaces: msg.context.identifiedWorkspaces || [],
                executionTimeMs: msg.context.executionTimeMs || 0,
                resultCount: msg.context.resultCount || 0,
                sqlExecuted: !!msg.context.generatedSql,
                confidenceScore: null,
                confidenceLevel: null
              },
              confidenceScore: null, // Pas stocké en base
              chartData: msg.context.chartData || null
            };

            console.log('Created response with chartData:', !!response.chartData);
            chatMessage.response = response;

            // Si on a des résultats de requête, les marquer comme JSON data
            if (msg.context.queryResults && msg.context.queryResults.length > 0) {
              chatMessage.hasJsonData = true;
              chatMessage.jsonData = msg.context.queryResults;
            }

            // Mettre à jour lastResponse avec le dernier message assistant
            this.lastResponse = response;
          }

          this.messages.push(chatMessage);
        });

        console.log('Conversation loaded successfully, messages:', this.messages.length);
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        // Optionnel: afficher une notification d'erreur à l'utilisateur
      }
    });
  }

  onNewChat(): void {
    // Réinitialiser la conversation
    this.messages = [];
    this.sessionId = null;
    this.lastResponse = null;
  }

  /**
   * Supprime le JSON formaté de la réponse textuelle
   * Détecte les patterns type ```json ou format brut JSON
   */
  private removeJsonFromAnswer(answer: string): string {
    if (!answer) return answer;

    // Supprimer TOUT contenu qui ressemble à du JSON markdown (avec backticks)
    // Pattern pour capturer ```json ... ``` ou ``` ... ``` (avec ou sans "json")
    let cleaned = answer.replace(/```(?:json)?\s*[\s\S]*?```/gi, '').trim();

    // Supprimer les objets JSON bruts qui commencent par { "type": "table"
    cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"table"[\s\S]*?\}\s*/gi, '').trim();

    // Détecter et supprimer les tableaux JSON bruts [...]
    const jsonArrayStartIndex = cleaned.indexOf('[');
    if (jsonArrayStartIndex !== -1) {
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = jsonArrayStartIndex; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '[') {
            bracketCount++;
          } else if (char === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              // On a trouvé la fin du tableau JSON
              cleaned = cleaned.substring(0, jsonArrayStartIndex) + cleaned.substring(i + 1);
              break;
            }
          }
        }
      }
    }

    return cleaned.trim();
  }
}
