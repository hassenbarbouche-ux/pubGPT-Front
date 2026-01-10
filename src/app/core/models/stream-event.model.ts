/**
 * Interface pour les événements SSE (Server-Sent Events)
 * Correspond au DTO StreamEvent du backend Java
 */
export interface StreamEvent {
  step: string;
  message: string;
  data: any;
  timestamp: string;
}

/**
 * Types d'événements SSE possibles
 */
export type StreamEventType =
  | 'session_created'
  | 'intent'
  | 'intent_result'
  | 'workspace'
  | 'workspace_result'
  | 'workspace_fallback'
  | 'sql_examples'
  | 'sql_examples_result'
  | 'table_search'
  | 'table_search_result'
  | 'fk_expansion'
  | 'fk_expansion_result'
  | 'schema_retrieval'
  | 'schema_retrieval_result'
  | 'sql_generation'
  | 'sql_preview'
  | 'confidence_score'
  | 'execution'
  | 'execution_result'
  | 'answer_generation'
  | 'sql_retry'
  | 'sql_retry_success'
  | 'result'
  | 'error';
