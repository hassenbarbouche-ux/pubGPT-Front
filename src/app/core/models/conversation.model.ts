/**
 * Modèles TypeScript pour les conversations (correspondant aux DTOs backend)
 */

export interface ConversationSummary {
  sessionId: string;
  title: string;
  createdAt: Date;
  lastAccessedAt: Date;
  messageCount: number;
  preview: string;
}

export interface ConversationDetail {
  sessionId: string;
  title: string;
  createdAt: Date;
  lastAccessedAt: Date;
  messages: MessageDetail[];
}

export interface MessageDetail {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
  context?: MessageContext;
}

export interface MessageContext {
  generatedSql?: string;
  intent?: string;
  resultCount?: number;
  executionTimeMs?: number;
  queryResults?: any[];
  chartData?: any;
  identifiedTables?: string[];
  identifiedWorkspaces?: string[];
  resultColumns?: string[];
}

export interface ContinueConversationRequest {
  question: string;
  userId: number;
  isChartDemanded?: boolean;
}
