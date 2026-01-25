/**
 * Modèles TypeScript pour la gestion de l'ambiguïté dans les questions utilisateur.
 * Correspondent aux DTOs Java du backend (AmbiguityResponseDto, ClarificationQuestionDto, ClarificationContextDto).
 */

/**
 * Question de clarification avec ses choix possibles.
 * Correspond au DTO Java ClarificationQuestionDto.
 */
export interface ClarificationQuestion {
  /** La question de clarification à poser à l'utilisateur */
  question: string;

  /** Liste des choix possibles (2 à 3 maximum) */
  choices: string[];
}

/**
 * Réponse d'ambiguïté du backend contenant les questions de clarification.
 * Correspond au DTO Java AmbiguityResponseDto.
 */
export interface AmbiguityResponse {
  /** Indique si une ambiguïté a été détectée */
  hasAmbiguity: boolean;

  /** Liste des questions de clarification (1 à 3 maximum) */
  questions: ClarificationQuestion[];
}

/**
 * Contexte de clarification à envoyer au backend lors du second appel.
 * Contient les réponses de l'utilisateur aux questions.
 * Correspond au DTO Java ClarificationContextDto.
 */
export interface ClarificationContext {
  /**
   * Map des réponses utilisateur.
   * Clé: La question posée
   * Valeur: La réponse choisie (ou "Autre: {texte}" pour réponse personnalisée)
   */
  userAnswers: Record<string, string>;
}

/**
 * Réponse d'une question individuelle (état UI temporaire).
 * Utilisé pour gérer le state dans le stepper dialog.
 */
export interface ClarificationAnswer {
  /** La question à laquelle on répond */
  question: string;

  /** Le choix sélectionné parmi les options */
  selectedChoice: string | null;

  /** Réponse personnalisée si "Autre" est sélectionné */
  customAnswer: string;
}
