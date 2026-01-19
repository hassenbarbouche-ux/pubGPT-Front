import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessage, ChatResponse, StreamEvent } from '../../core/models';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { InputBarComponent, QuestionSubmit } from './components/input-bar/input-bar.component';
import { ChatDrawerComponent } from './components/chat-drawer/chat-drawer.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    HeaderBarComponent,
    MessageListComponent,
    InputBarComponent,
    ChatDrawerComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  isProcessing: boolean = false;
  sessionId: string | null = null;
  lastResponse: ChatResponse | null = null;
  isDrawerOpen: boolean = true; // Drawer ouvert par défaut

  private subscription?: Subscription;

  // Limite de messages (5 questions utilisateur max)
  readonly MAX_USER_MESSAGES = 5;

  get userMessageCount(): number {
    return this.messages.filter(m => m.role === 'user').length;
  }

  get isMaxMessagesReached(): boolean {
    return this.userMessageCount >= this.MAX_USER_MESSAGES;
  }

  constructor(
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    // Optionnel: vérifier la santé du backend
    this.chatService.healthCheck().subscribe({
      next: (response) => console.log('Backend health:', response),
      error: (error) => console.error('Backend health check failed:', error)
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSendMessage(questionSubmit: QuestionSubmit | string): void {
    // Support pour les deux formats (ancien string et nouveau QuestionSubmit)
    const question = typeof questionSubmit === 'string' ? questionSubmit : questionSubmit.question;
    const isChartDemanded = typeof questionSubmit === 'string' ? false : questionSubmit.isChartDemanded;

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    this.isProcessing = true;

    // Créer une référence pour le message assistant qui sera créé plus tard
    let assistantMessage: ChatMessage | null = null;

    // Appeler le service SSE avec isChartDemanded
    this.subscription = this.chatService.streamChat(question, this.sessionId ?? undefined, isChartDemanded).subscribe({
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
            streamingSteps: []
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
      }
    });
  }

  private handleStreamEvent(event: StreamEvent, message: ChatMessage): void {
    console.log('SSE Event:', event);

    // Mettre à jour les étapes de progression (sauf pour session_created)
    if (event.step !== 'result' && event.step !== 'error' && event.step !== 'session_created') {
      if (!message.streamingSteps) {
        message.streamingSteps = [];
      }
      message.streamingSteps.push(event.message);
    }

    // Gérer l'événement de session créée
    if (event.step === 'session_created' && event.data?.sessionId) {
      this.sessionId = event.data.sessionId;
    }

    // Gérer le résultat final
    if (event.step === 'result' && event.data) {
      const response: ChatResponse = event.data;
      message.response = response;
      this.lastResponse = response;
      this.sessionId = response.sessionId;

      // Détecter et extraire les données JSON pour affichage en tableau
      if (response.queryResults && Array.isArray(response.queryResults) && response.queryResults.length > 0) {
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

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  onChatSelected(chatId: string): void {
    // TODO: Implémenter le chargement de la conversation sélectionnée
    console.log('Chat selected:', chatId);
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
