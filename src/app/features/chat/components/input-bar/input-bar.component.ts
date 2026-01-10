import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

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
    TextFieldModule
  ],
  templateUrl: './input-bar.component.html',
  styleUrl: './input-bar.component.scss'
})
export class InputBarComponent {
  @Input() disabled: boolean = false;
  @Output() sendMessage = new EventEmitter<string>();

  question: string = '';

  onSend(): void {
    if (this.question.trim() && !this.disabled) {
      this.sendMessage.emit(this.question.trim());
      this.question = '';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }
}
