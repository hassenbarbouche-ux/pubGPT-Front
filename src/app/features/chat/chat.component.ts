import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessage, ChatResponse, StreamEvent } from '../../core/models';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { InputBarComponent } from './components/input-bar/input-bar.component';
import { SqlDialogComponent } from './components/sql-dialog/sql-dialog.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    HeaderBarComponent,
    MessageListComponent,
    InputBarComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  isProcessing: boolean = false;
  sessionId: string | null = null;
  lastResponse: ChatResponse | null = null;

  private subscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private dialog: MatDialog
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

  onSendMessage(question: string): void {
    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    // Créer le message assistant (en attente)
    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      streamingSteps: []
    };
    this.messages.push(assistantMessage);

    this.isProcessing = true;

    // Appeler le service SSE
    this.subscription = this.chatService.streamChat(question, this.sessionId ?? undefined).subscribe({
      next: (event: StreamEvent) => {
        this.handleStreamEvent(event, assistantMessage);
      },
      error: (error) => {
        console.error('Erreur SSE:', error);
        assistantMessage.content = 'Désolé, une erreur est survenue lors du traitement de votre question.';
        assistantMessage.isStreaming = false;
        this.isProcessing = false;
      },
      complete: () => {
        assistantMessage.isStreaming = false;
        this.isProcessing = false;
      }
    });
  }

  private handleStreamEvent(event: StreamEvent, message: ChatMessage): void {
    console.log('SSE Event:', event);

    // Mettre à jour les étapes de progression
    if (event.step !== 'result' && event.step !== 'error') {
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
        message.content = this.removeJsonFromAnswer(response.answer);
      } else {
        message.content = response.answer;
      }
    }

    // Gérer les erreurs
    if (event.step === 'error') {
      message.content = `Erreur: ${event.message}`;
    }
  }

  onSqlClick(): void {
    if (this.lastResponse?.generatedSql) {
      this.dialog.open(SqlDialogComponent, {
        width: '800px',
        data: {
          sql: this.lastResponse.generatedSql,
          tables: this.lastResponse.metadata.identifiedTables,
          executionTime: this.lastResponse.metadata.executionTimeMs
        }
      });
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

  /**
   * Supprime le JSON formaté de la réponse textuelle
   * Détecte les patterns type ```json ou format brut JSON
   */
  private removeJsonFromAnswer(answer: string): string {
    if (!answer) return answer;

    // Supprimer les blocs JSON markdown (```json...```)
    let cleaned = answer.replace(/```json\s*[\s\S]*?```/gi, '').trim();

    // Supprimer les objets JSON bruts qui commencent par { "type": "table"
    cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"table"[\s\S]*?\}\s*/gi, '').trim();

    return cleaned;
  }
}
