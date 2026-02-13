import { ChartData } from './chart-data.model';
import { AmbiguityResponse } from './ambiguity.model';

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
  chartData?: ChartData | null;

  /**
   * Information sur l'ambiguïté détectée dans la question utilisateur.
   * Présent uniquement si le SqlGenerator détecte une ambiguïté et ne peut pas
   * générer de requête SQL sans clarifications supplémentaires.
   *
   * Quand ce champ est non-null, le frontend doit:
   * 1. Afficher une popup stepper avec les questions de clarification
   * 2. Collecter les réponses de l'utilisateur
   * 3. Faire un second appel API avec clarificationContext
   *
   * Les autres champs (answer, generatedSql, queryResults) seront null quand une ambiguïté est détectée.
   */
  ambiguityDetected?: AmbiguityResponse | null;

  /**
   * Explication métier de la requête SQL générée.
   * Explique en 4-5 phrases comment la requête répond à la question utilisateur.
   * Présent uniquement si isExplanationDemanded=true et SQL généré avec succès.
   */
  businessExplanation?: string | null;

  /**
   * Sous-réponses pour affichage multi-tableaux.
   * Présent quand l'orchestrateur produit 2+ jeux de données distincts.
   * Si présent, le frontend affiche chaque sub-response comme section titrée + tableau.
   */
  subResponses?: SubResponse[] | null;
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

/**
 * Sous-réponse pour affichage multi-tableaux.
 * Chaque SubResponse correspond à un jeu de données avec son titre.
 */
export interface SubResponse {
  title: string;
  queryResults: Record<string, any>[];
}
