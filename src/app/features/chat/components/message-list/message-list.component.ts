import { Component, Input, Output, EventEmitter, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../../core/models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    MessageBubbleComponent
  ],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss'
})
export class MessageListComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Output() exampleClick = new EventEmitter<string>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  backgroundVideo = '/videos/video.mp4';
  private shouldScrollToBottom = true;

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

  onExampleClick(example: string): void {
    this.exampleClick.emit(example);
  }
}
