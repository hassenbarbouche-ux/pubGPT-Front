import { ChatResponse } from './chat-response.model';

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
