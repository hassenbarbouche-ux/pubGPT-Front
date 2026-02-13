import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ConversationSummary,
  ConversationDetail,
  ContinueConversationRequest
} from '../models/conversation.model';

/**
 * Service Angular pour la gestion des conversations persistées.
 * Communique avec le ConversationController backend.
 */
@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private apiUrl = `${environment.apiUrl}/conversations`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer la liste des conversations d'un utilisateur
   */
  getUserConversations(userId: number, limit: number = 20): Observable<ConversationSummary[]> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('limit', limit.toString());

    return this.http.get<ConversationSummary[]>(this.apiUrl, { params }).pipe(
      map(conversations =>
        conversations.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          lastAccessedAt: new Date(conv.lastAccessedAt)
        }))
      )
    );
  }

  /**
   * Charger une conversation complète
   */
  getConversation(sessionId: string, withResults: boolean = false): Observable<ConversationDetail> {
    const params = new HttpParams().set('withResults', withResults.toString());

    return this.http.get<ConversationDetail>(`${this.apiUrl}/${sessionId}`, { params }).pipe(
      map(conversation => ({
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        lastAccessedAt: new Date(conversation.lastAccessedAt),
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
    );
  }

  /**
   * Continuer une conversation existante
   */
  continueConversation(sessionId: string, request: ContinueConversationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/continue`, request);
  }

  /**
   * Supprimer une conversation
   */
  deleteConversation(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sessionId}`);
  }
}
