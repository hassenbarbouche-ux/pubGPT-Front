import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHECKLIST_ITEMS, ChecklistItem, ChecklistItemState, ChecklistSubItem, PLANNER_SUB_ITEMS, isPlannerActive } from '../../../../core/models/checklist.model';

@Component({
  selector: 'app-streaming-checklist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checklist-container">
      <!-- Loader bar -->
      <div class="loader-bar-wrapper">
        <div class="loader-bar"></div>
      </div>

      <ng-container *ngFor="let item of checklistItems; trackBy: trackById">
        <ng-container *ngIf="shouldShowItem(item.id)">

          <!-- Orchestration item with reasoning floating right -->
          <div
            *ngIf="item.id === 'orchestration' && isOrchestratorVisible"
            class="orchestration-anchor"
          >
            <div
              class="checklist-item"
              [class.pending]="getItemState(item.id) === 'pending'"
              [class.in-progress]="getItemState(item.id) === 'in_progress'"
              [class.completed]="getItemState(item.id) === 'completed'"
            >
              <div class="checkbox">
                <svg *ngIf="getItemState(item.id) === 'completed'" width="10" height="8" viewBox="0 0 10 8">
                  <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
                <div *ngIf="getItemState(item.id) === 'in_progress'" class="checkbox-dot"></div>
              </div>
              <span class="item-label">{{ item.label }}</span>
            </div>

            <!-- Floating reasoning panel (absolute, doesn't affect vertical flow) -->
            <div class="orchestrator-floating">
              <div class="orchestrator-connector"></div>
              <div class="orchestrator-reasoning-content">
                <ng-container *ngIf="orchestratorReasoning; else decompositionBlock">
                  <div class="orchestrator-reasoning-header">Reflexion:</div>
                  <div class="orchestrator-reasoning-text">{{ orchestratorReasoning }}</div>
                </ng-container>
                <ng-template #decompositionBlock>
                  <div class="orchestrator-reasoning-header">Decomposition en sous-taches:</div>
                  <div class="orchestrator-reasoning-text">Analyse de la complexite de votre question et planification des etapes necessaires...</div>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- Normal checklist items (non-orchestration) -->
          <div
            *ngIf="item.id !== 'orchestration'"
            class="checklist-item"
            [class.pending]="getItemState(item.id) === 'pending'"
            [class.in-progress]="getItemState(item.id) === 'in_progress'"
            [class.completed]="getItemState(item.id) === 'completed'"
            [class.skipped]="getItemState(item.id) === 'skipped'"
          >
            <div class="checkbox">
              <svg *ngIf="getItemState(item.id) === 'completed'" width="10" height="8" viewBox="0 0 10 8">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
              <div *ngIf="getItemState(item.id) === 'in_progress'" class="checkbox-dot"></div>
            </div>
            <span class="item-label">{{ item.label }}</span>
          </div>

          <!-- Planner sub-items -->
          <div
            *ngIf="item.id === 'sql_generation' && isPlannerVisible"
            class="planner-sub-items"
          >
            <div class="planner-connector"></div>
            <div class="planner-phases">
              <div
                *ngFor="let subItem of plannerSubItems; trackBy: trackBySubId"
                class="checklist-item sub-item"
                [class.pending]="getItemState(subItem.id) === 'pending'"
                [class.in-progress]="getItemState(subItem.id) === 'in_progress'"
                [class.completed]="getItemState(subItem.id) === 'completed'"
              >
                <div class="checkbox">
                  <svg *ngIf="getItemState(subItem.id) === 'completed'" width="10" height="8" viewBox="0 0 10 8">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  </svg>
                  <div *ngIf="getItemState(subItem.id) === 'in_progress'" class="checkbox-dot"></div>
                </div>
                <span class="item-label">{{ subItem.label }}</span>
              </div>
            </div>
          </div>

        </ng-container>
      </ng-container>
    </div>
  `,
  styleUrls: ['./streaming-checklist.component.scss']
})
export class StreamingChecklistComponent {
  @Input() checklistState!: Map<string, ChecklistItemState>;
  @Input() isPlannerVisible: boolean = false;
  @Input() isOrchestratorVisible: boolean = false;
  @Input() orchestratorReasoning: string = '';

  checklistItems = CHECKLIST_ITEMS;
  plannerSubItems = PLANNER_SUB_ITEMS;

  getItemState(itemId: string): ChecklistItemState {
    return this.checklistState?.get(itemId) || 'pending';
  }

  shouldShowItem(itemId: string): boolean {
    if (this.isOrchestratorVisible) {
      return itemId !== 'sql_generation';
    }
    return itemId !== 'orchestration';
  }

  trackById(index: number, item: ChecklistItem): string {
    return item.id;
  }

  trackBySubId(index: number, item: ChecklistSubItem): string {
    return item.id;
  }
}
