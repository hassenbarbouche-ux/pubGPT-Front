/**
 * État d'un item de la checklist
 */
export type ChecklistItemState = 'pending' | 'in_progress' | 'completed' | 'skipped';

/**
 * Sous-item de la checklist (pour les phases du Planner)
 */
export interface ChecklistSubItem {
  id: string;
  label: string;
  eventTrigger: string;
}

/**
 * Item de la checklist
 */
export interface ChecklistItem {
  id: string;
  label: string;
  eventTriggers: string[];
  subItems?: ChecklistSubItem[];  // Sous-items optionnels (ex: phases du Planner)
}

/**
 * Liste fixe des événements de la checklist.
 * En mode classique : les 7 steps habituels (orchestration reste hidden/pending).
 * En mode orchestrateur : sql_generation est skipped et orchestration devient active.
 */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'intent',
    label: 'Analyse de l\'intention',
    eventTriggers: ['intent', 'intent_result']
  },
  {
    id: 'workspace',
    label: 'Identification du contexte',
    eventTriggers: ['workspace', 'workspace_result', 'workspace_fallback']
  },
  {
    id: 'schema',
    label: 'Recherche des schémas',
    eventTriggers: ['table_search', 'table_search_result', 'fk_expansion', 'fk_expansion_result', 'schema_retrieval', 'schema_retrieval_result']
  },
  {
    id: 'sql_examples',
    label: 'Recherche d\'exemples SQL',
    eventTriggers: ['sql_examples', 'sql_examples_result']
  },
  {
    id: 'sql_generation',
    label: 'Génération de la requête SQL',
    eventTriggers: [
      'sql_generation', 'sql_preview', 'confidence_score', 'ambiguity_detected', 'ambiguity_resolution',
      'planner_requested', 'planner_execution', 'planner_strategy', 'planner_thinking', 'planner_synthesis', 'planner_completed'
    ],
    subItems: [
      { id: 'planner_strategy', label: 'Planner: établir stratégie', eventTrigger: 'planner_strategy' },
      { id: 'planner_thinking', label: 'Planner: Thinking', eventTrigger: 'planner_thinking' },
      { id: 'planner_synthesis', label: 'Planner: Synthétisation', eventTrigger: 'planner_synthesis' }
    ]
  },
  {
    id: 'orchestration',
    label: 'Orchestration',
    eventTriggers: ['orchestrator', 'orchestrator_thinking', 'orchestrator_plan', 'orchestrator_reasoning', 'orchestrator_task', 'orchestrator_synthesis']
  },
  {
    id: 'execution',
    label: 'Exécution de la requête',
    eventTriggers: ['execution', 'execution_result', 'sql_retry', 'sql_retry_success']
  },
  {
    id: 'answer',
    label: 'Génération de la réponse',
    eventTriggers: ['answer_generation', 'chart_generation', 'chart_generated', 'result']
  }
];

/**
 * Trouve l'item de checklist correspondant à un événement SSE
 */
export function getChecklistItemFromEvent(eventStep: string): ChecklistItem | undefined {
  return CHECKLIST_ITEMS.find(item => item.eventTriggers.includes(eventStep));
}

/**
 * Liste des sous-items du Planner (pour affichage conditionnel)
 */
export const PLANNER_SUB_ITEMS: ChecklistSubItem[] = [
  { id: 'planner_strategy', label: 'Planner: établir stratégie', eventTrigger: 'planner_strategy' },
  { id: 'planner_thinking', label: 'Planner: Thinking', eventTrigger: 'planner_thinking' },
  { id: 'planner_synthesis', label: 'Planner: Synthétisation', eventTrigger: 'planner_synthesis' }
];

/**
 * Initialise l'état de la checklist (tous en pending)
 */
export function initChecklistState(): Map<string, ChecklistItemState> {
  const state = new Map<string, ChecklistItemState>();
  CHECKLIST_ITEMS.forEach(item => {
    state.set(item.id, 'pending');
    // Initialiser aussi les sous-items si présents
    if (item.subItems) {
      item.subItems.forEach(subItem => {
        state.set(subItem.id, 'pending');
      });
    }
  });
  return state;
}

/**
 * Vérifie si le Planner est actif (au moins un sous-item n'est pas pending)
 */
export function isPlannerActive(checklistState: Map<string, ChecklistItemState>): boolean {
  return PLANNER_SUB_ITEMS.some(item => {
    const state = checklistState.get(item.id);
    return state === 'in_progress' || state === 'completed';
  });
}
