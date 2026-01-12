import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-drawer.component.html',
  styleUrl: './chat-drawer.component.scss'
})
export class ChatDrawerComponent {
  @Input() isOpen = true; // Ouvert par défaut
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() chatSelected = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();

  chatHistory: ChatHistory[] = [
    {
      id: '1',
      title: 'Masse après injection insuline',
      timestamp: new Date(2024, 0, 10, 14, 30)
    },
    {
      id: '2',
      title: 'Tester un système RAG',
      timestamp: new Date(2024, 0, 9, 10, 15)
    },
    {
      id: '3',
      title: 'Analyse Text-to-SQL Entreprise',
      timestamp: new Date(2024, 0, 8, 16, 45)
    },
    {
      id: '4',
      title: 'Versionnement des prompts IA',
      timestamp: new Date(2024, 0, 7, 9, 20)
    },
    {
      id: '5',
      title: 'Assurance prêt immobilier chimio',
      timestamp: new Date(2024, 0, 6, 11, 0)
    },
    {
      id: '6',
      title: 'Logo pour pubGPT',
      timestamp: new Date(2024, 0, 5, 15, 30)
    }
  ];

  toggleDrawer(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  closeDrawer(): void {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
  }

  selectChat(chatId: string): void {
    this.chatSelected.emit(chatId);
    // Ne ferme pas le drawer automatiquement
  }

  createNewChat(): void {
    this.newChat.emit();
    // Ne ferme pas le drawer automatiquement
  }
}
