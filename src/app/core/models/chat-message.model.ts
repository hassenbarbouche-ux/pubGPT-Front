import { ChatResponse, SubResponse } from './chat-response.model';
import { ChecklistItemState } from './checklist.model';

/**
 * Message de chat affiché dans l'interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingSteps?: string[];
  response?: ChatResponse;
  hasJsonData?: boolean;
  jsonData?: any[];
  subResponses?: SubResponse[];
  checklistState?: Map<string, ChecklistItemState>;
  isPlannerVisible?: boolean;  // Flag pour afficher les sous-étapes du Planner
  isOrchestratorVisible?: boolean;  // Flag pour afficher le panneau orchestrateur
  orchestratorReasoning?: string;   // Dernier reasoning de l'orchestrateur
  selectedColumns?: string[];       // Colonnes choisies par l'utilisateur (format TABLE.COL)
}

/**
 * État du chat
 */
export interface ChatState {
  messages: ChatMessage[];
  currentStreamingSteps: string[];
  isProcessing: boolean;
  sessionId: string | null;
  lastResponse: ChatResponse | null;
}
