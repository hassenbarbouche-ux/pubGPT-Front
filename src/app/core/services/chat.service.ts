import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StreamEvent, ChatResponse } from '../models';

/**
 * Service de chat avec support SSE (Server-Sent Events)
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // En dev, utiliser /api grâce au proxy (voir proxy.conf.json)
  // En prod, l'URL sera configurée via environment
  private readonly API_URL = '/api/v1/chat';

  constructor() {}

  /**
   * Envoie une question et reçoit les événements SSE en streaming
   *
   * @param question Question de l'utilisateur
   * @param sessionId ID de session (optionnel)
   * @returns Observable d'événements SSE
   */
  streamChat(question: string, sessionId?: string): Observable<StreamEvent> {
    return new Observable(observer => {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.append('question', question);
      if (sessionId) {
        params.append('sessionId', sessionId);
      }

      const url = `${this.API_URL}/stream?${params.toString()}`;

      // Créer la connexion SSE
      const eventSource = new EventSource(url);

      // Gérer les événements de progression (step)
      const eventTypes = [
        'session_created', 'intent', 'intent_result',
        'workspace', 'workspace_result', 'workspace_fallback',
        'sql_examples', 'sql_examples_result',
        'table_search', 'table_search_result',
        'fk_expansion', 'fk_expansion_result',
        'schema_retrieval', 'schema_retrieval_result',
        'sql_generation', 'sql_preview',
        'confidence_score', 'execution', 'execution_result',
        'answer_generation', 'sql_retry', 'sql_retry_success',
        'result', 'error'
      ];

      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data: StreamEvent = JSON.parse(event.data);
            observer.next(data);

            // Si c'est le résultat final ou une erreur, terminer le stream
            if (eventType === 'result' || eventType === 'error') {
              observer.complete();
              eventSource.close();
            }
          } catch (error) {
            console.error('Erreur de parsing SSE:', error);
            observer.error(error);
            eventSource.close();
          }
        });
      });

      // Gérer les erreurs de connexion
      eventSource.onerror = (error) => {
        console.error('Erreur SSE:', error);
        observer.error(error);
        eventSource.close();
      };

      // Cleanup lors de l'unsubscribe
      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Vérifie la santé du service backend
   */
  healthCheck(): Observable<string> {
    return new Observable(observer => {
      fetch(`${this.API_URL}/health`)
        .then(response => response.text())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}
