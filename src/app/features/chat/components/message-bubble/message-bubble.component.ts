import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from '../../../../core/models';
import { JsonTableComponent } from '../json-table/json-table.component';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    JsonTableComponent
  ],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(-60px) scale(0.9)'
        }),
        animate('1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', style({
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }))
      ])
    ])
  ]
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;

  /**
   * Retourne uniquement la dernière étape de streaming
   * Pour afficher une seule étape à la fois (comme ChatGPT)
   */
  getCurrentStep(): string | null {
    if (!this.message.streamingSteps || this.message.streamingSteps.length === 0) {
      return null;
    }
    return this.message.streamingSteps[this.message.streamingSteps.length - 1];
  }
}
