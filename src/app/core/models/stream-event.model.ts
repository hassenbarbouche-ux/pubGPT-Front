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
  | 'error'
  // Planner events
  | 'planner_requested'
  | 'planner_execution'
  | 'planner_strategy'
  | 'planner_thinking'
  | 'planner_synthesis'
  | 'planner_completed'
  // Orchestrator events
  | 'orchestrator'
  | 'orchestrator_thinking'
  | 'orchestrator_plan'
  | 'orchestrator_reasoning'
  | 'orchestrator_task'
  | 'orchestrator_synthesis';

/**
 * Interface pour les données d'événement Planner
 */
export interface PlannerEventData {
  phase: 'planner_strategy' | 'planner_thinking' | 'planner_synthesis';
  status: 'in_progress' | 'completed';
  attempt: number;
}

/**
 * Interface pour les données d'événement du plan orchestrateur
 */
export interface OrchestratorPlanEventData {
  totalStepsEstimated: number;
  steps: Array<{
    id: string;
    description: string;
    type: string;
    tool: string | null;
  }>;
}

/**
 * Interface pour les données d'événement reasoning orchestrateur
 */
export interface OrchestratorReasoningEventData {
  reasoning: string;
  status: string;
  iteration: number;
}
