import { Component, Input, Output, EventEmitter, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../../core/models';
import { ChecklistItemState } from '../../../../core/models/checklist.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { StreamingChecklistComponent } from '../streaming-checklist/streaming-checklist.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    MessageBubbleComponent,
    StreamingChecklistComponent
  ],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss'
})
export class MessageListComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Output() exampleClick = new EventEmitter<string>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  backgroundVideo = '/videos/video.mp4';
  private shouldScrollToBottom = false; // Désactivé pour éviter le scroll automatique

  examples = [
    'Donne moi les briefs Peugeot de 2025 avec leurs spots et leurs tarifs',
    'Combien de campagnes ont été diffusées ce mois-ci?',
    'Quelles chaînes sont les plus utilisées?'
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        const element = this.scrollContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  /**
   * Vérifie si le message suivant est en cours de streaming
   */
  isNextMessageStreaming(currentIndex: number): boolean {
    const nextMessage = this.messages[currentIndex + 1];
    return nextMessage?.isStreaming === true;
  }

  /**
   * Retourne l'étape courante du message suivant (s'il est en streaming)
   */
  getNextMessageCurrentStep(currentIndex: number): string | null {
    const nextMessage = this.messages[currentIndex + 1];
    if (!nextMessage || !nextMessage.isStreaming || !nextMessage.streamingSteps) {
      return null;
    }
    return nextMessage.streamingSteps[nextMessage.streamingSteps.length - 1] || null;
  }

  /**
   * Récupère l'état de la checklist du message assistant suivant (si en streaming)
   */
  getNextMessageChecklistState(currentIndex: number): Map<string, ChecklistItemState> | null {
    if (currentIndex + 1 < this.messages.length) {
      const nextMessage = this.messages[currentIndex + 1];
      if (nextMessage.role === 'assistant' && nextMessage.isStreaming && nextMessage.checklistState) {
        return nextMessage.checklistState;
      }
    }
    return null;
  }

  /**
   * Vérifie si le Planner est visible pour le message assistant suivant
   */
  isNextMessagePlannerVisible(currentIndex: number): boolean {
    if (currentIndex + 1 < this.messages.length) {
      const nextMessage = this.messages[currentIndex + 1];
      return nextMessage.role === 'assistant' && nextMessage.isStreaming === true && nextMessage.isPlannerVisible === true;
    }
    return false;
  }

  /**
   * Vérifie si l'orchestrateur est visible pour le message assistant suivant
   */
  isNextMessageOrchestratorVisible(currentIndex: number): boolean {
    if (currentIndex + 1 < this.messages.length) {
      const nextMessage = this.messages[currentIndex + 1];
      return nextMessage.role === 'assistant' && nextMessage.isStreaming === true && nextMessage.isOrchestratorVisible === true;
    }
    return false;
  }

  /**
   * Récupère le reasoning de l'orchestrateur du message assistant suivant
   */
  getNextMessageOrchestratorReasoning(currentIndex: number): string {
    if (currentIndex + 1 < this.messages.length) {
      const nextMessage = this.messages[currentIndex + 1];
      if (nextMessage.role === 'assistant' && nextMessage.isStreaming) {
        return nextMessage.orchestratorReasoning || '';
      }
    }
    return '';
  }

  onExampleClick(example: string): void {
    this.exampleClick.emit(example);
  }
}
