/**
 * Interface pour la réponse finale du chat
 * Correspond au DTO ChatResponse du backend Java
 */
export interface ChatResponse {
  sessionId: string;
  answer: string;
  generatedSql: string | null;
  queryResults: Record<string, any>[] | null;
  metadata: ExecutionMetadata;
  confidenceScore: SqlConfidenceScore | null;
}

/**
 * Métadonnées d'exécution
 */
export interface ExecutionMetadata {
  intent: string;
  identifiedWorkspaces: string[] | null;
  identifiedTables: string[];
  identifiedColumns: string[];
  executionTimeMs: number;
  resultCount: number;
  sqlExecuted: boolean;
  confidenceScore: number | null;
  confidenceLevel: string | null;
}

/**
 * Score de confiance SQL
 */
export interface SqlConfidenceScore {
  globalScore: number;
  level: ConfidenceLevel;
  recommendation: string;
}

/**
 * Niveaux de confiance possibles
 */
export type ConfidenceLevel = 'TRES_ELEVE' | 'ELEVE' | 'MOYEN' | 'FAIBLE';
