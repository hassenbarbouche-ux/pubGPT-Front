import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreamEvent, ChatResponse } from '../models';
import { ClarificationContext } from '../models/ambiguity.model';

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

  constructor(private http: HttpClient) {}

  /**
   * Envoie une question et reçoit les événements SSE en streaming
   *
   * @param question Question de l'utilisateur
   * @param userId ID de l'utilisateur (requis pour le tracking des tokens)
   * @param sessionId ID de session (optionnel)
   * @param isChartDemanded Indique si l'utilisateur souhaite un graphique (optionnel, défaut: false)
   * @returns Observable d'événements SSE
   */
  streamChat(question: string, userId: number, sessionId?: string, isChartDemanded: boolean = false): Observable<StreamEvent> {
    return new Observable(observer => {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.append('question', question);
      params.append('userId', userId.toString());
      if (sessionId) {
        params.append('sessionId', sessionId);
      }
      params.append('isChartDemanded', isChartDemanded.toString());

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
        'ambiguity_detected',  // Nouvelle événement pour la détection d'ambiguïté
        'result', 'error'
      ];

      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data: StreamEvent = JSON.parse(event.data);
            observer.next(data);

            // Si c'est le résultat final, une erreur, ou une ambiguïté détectée, terminer le stream
            if (eventType === 'result' || eventType === 'error' || eventType === 'ambiguity_detected') {
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

  /**
   * Envoie une question avec un contexte de clarification (appel POST non-streaming)
   *
   * Cette méthode est utilisée après que l'utilisateur a répondu aux questions de clarification.
   * Contrairement à streamChat(), elle utilise un appel POST standard pour envoyer
   * le clarificationContext dans le body de la requête.
   *
   * @param question Question originale de l'utilisateur
   * @param userId ID de l'utilisateur (requis pour le tracking des tokens)
   * @param clarificationContext Réponses de l'utilisateur aux questions de clarification
   * @param sessionId ID de session (optionnel)
   * @param isChartDemanded Indique si l'utilisateur souhaite un graphique (optionnel, défaut: false)
   * @returns Observable contenant la réponse finale du chat
   */
  sendMessageWithClarification(
    question: string,
    userId: number,
    clarificationContext: ClarificationContext,
    sessionId?: string,
    isChartDemanded: boolean = false
  ): Observable<ChatResponse> {
    const body = {
      question,
      userId,
      sessionId,
      isChartDemanded,
      clarificationContext
    };

    return this.http.post<ChatResponse>(this.API_URL, body);
  }
}
