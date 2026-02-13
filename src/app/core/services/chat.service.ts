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
   * @param isExplanationDemanded Indique si l'utilisateur souhaite une explication métier (optionnel, défaut: false)
   * @param selectedColumns Colonnes sélectionnées par l'utilisateur (optionnel)
   * @returns Observable d'événements SSE
   */
  streamChat(question: string, userId: number, sessionId?: string, isChartDemanded: boolean = false, isExplanationDemanded: boolean = false, selectedColumns?: string[]): Observable<StreamEvent> {
    return new Observable(observer => {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.append('question', question);
      params.append('userId', userId.toString());
      if (sessionId) {
        params.append('sessionId', sessionId);
      }
      params.append('isChartDemanded', isChartDemanded.toString());
      params.append('isExplanationDemanded', isExplanationDemanded.toString());
      // Ajouter les colonnes sélectionnées si présentes
      if (selectedColumns && selectedColumns.length > 0) {
        params.append('selectedColumns', selectedColumns.join(','));
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
        'ambiguity_detected',
        // Planner events
        'planner_requested', 'planner_execution',
        'planner_strategy', 'planner_thinking', 'planner_synthesis',
        'planner_completed',
        // Orchestrator events
        'orchestrator', 'orchestrator_thinking',
        'orchestrator_plan', 'orchestrator_reasoning',
        'orchestrator_task', 'orchestrator_synthesis',
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
   * Envoie une question avec un contexte de clarification via SSE (streaming)
   *
   * ✅ FIX: Cette méthode utilise maintenant SSE au lieu de POST pour éviter
   * le problème de routage vers ChatOrchestrationService.
   *
   * Le clarificationContext est encodé en JSON et passé en paramètre URL.
   *
   * @param question Question originale de l'utilisateur
   * @param userId ID de l'utilisateur (requis pour le tracking des tokens)
   * @param clarificationContext Réponses de l'utilisateur aux questions de clarification
   * @param sessionId ID de session (optionnel)
   * @param isChartDemanded Indique si l'utilisateur souhaite un graphique (optionnel, défaut: false)
   * @param isExplanationDemanded Indique si l'utilisateur souhaite une explication métier (optionnel, défaut: false)
   * @param selectedColumns Colonnes sélectionnées par l'utilisateur (optionnel)
   * @returns Observable d'événements SSE
   */
  streamChatWithClarification(
    question: string,
    userId: number,
    clarificationContext: ClarificationContext,
    sessionId?: string,
    isChartDemanded: boolean = false,
    isExplanationDemanded: boolean = false,
    selectedColumns?: string[]
  ): Observable<StreamEvent> {
    return new Observable(observer => {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.append('question', question);
      params.append('userId', userId.toString());
      if (sessionId) {
        params.append('sessionId', sessionId);
      }
      params.append('isChartDemanded', isChartDemanded.toString());
      params.append('isExplanationDemanded', isExplanationDemanded.toString());
      // Ajouter les colonnes sélectionnées si présentes
      if (selectedColumns && selectedColumns.length > 0) {
        params.append('selectedColumns', selectedColumns.join(','));
      }

      // ✅ FIX: Encoder le clarificationContext en JSON et l'ajouter aux params
      const clarificationJson = JSON.stringify(clarificationContext);
      params.append('clarificationJson', clarificationJson);

      const url = `${this.API_URL}/stream?${params.toString()}`;
      console.log('🔄 [SSE] Envoi avec clarifications:', url);

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
        'ambiguity_detected',
        // Planner events
        'planner_requested', 'planner_execution',
        'planner_strategy', 'planner_thinking', 'planner_synthesis',
        'planner_completed',
        // Orchestrator events
        'orchestrator', 'orchestrator_thinking',
        'orchestrator_plan', 'orchestrator_reasoning',
        'orchestrator_task', 'orchestrator_synthesis',
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
   * @deprecated Utiliser streamChatWithClarification() à la place pour éviter le problème de routage.
   * Cette méthode fait un POST vers /api/v1/chat qui route vers ChatOrchestrationService
   * au lieu de ChatStreamingService.
   */
  sendMessageWithClarification(
    question: string,
    userId: number,
    clarificationContext: ClarificationContext,
    sessionId?: string,
    isChartDemanded: boolean = false,
    isExplanationDemanded: boolean = false
  ): Observable<ChatResponse> {
    console.warn('⚠️ sendMessageWithClarification() est déprécié. Utiliser streamChatWithClarification() à la place.');

    const body = {
      question,
      userId,
      sessionId,
      isChartDemanded,
      isExplanationDemanded,
      clarificationContext
    };

    return this.http.post<ChatResponse>(this.API_URL, body);
  }
}
