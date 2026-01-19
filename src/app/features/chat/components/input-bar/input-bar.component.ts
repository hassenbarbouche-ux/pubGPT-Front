import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';

export interface QuestionSubmit {
  question: string;
  isChartDemanded: boolean;
}

@Component({
  selector: 'app-input-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    TextFieldModule
  ],
  templateUrl: './input-bar.component.html',
  styleUrl: './input-bar.component.scss'
})
export class InputBarComponent {
  @Input() disabled: boolean = false;
  @Input() maxMessagesReached: boolean = false;
  @Output() sendMessage = new EventEmitter<QuestionSubmit>();

  question: string = '';
  isChartDemanded: boolean = false;

  get isInputDisabled(): boolean {
    return this.disabled || this.maxMessagesReached;
  }

  onSend(): void {
    if (this.question.trim() && !this.isInputDisabled) {
      this.sendMessage.emit({
        question: this.question.trim(),
        isChartDemanded: this.isChartDemanded
      });
      this.question = '';
      // Garder la checkbox cochée pour les prochaines questions
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }
}
