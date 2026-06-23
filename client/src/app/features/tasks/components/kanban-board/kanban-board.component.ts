import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { BOARD_COLUMN_STATUSES } from '@features/tasks/models/task.enums';
import { KanbanColumnComponent } from '@features/tasks/components/kanban-column/kanban-column.component';
import { TaskStore } from '@features/tasks/stores/task.store';

@Component({
  selector: 'app-kanban-board',
  imports: [KanbanColumnComponent],
  template: `
    <div class="kanban-board" role="region" aria-label="Task board">
      @for (status of columns; track status) {
        <app-kanban-column
          [status]="status"
          [tasks]="tasksFor(status)"
          [connectedTo]="dropListIds()"
          [canEdit]="canEdit()"
          [canDelete]="canDelete()"
          (statusChange)="statusChange.emit($event)"
          (openTask)="openTask.emit($event)"
          (editTask)="editTask.emit($event)"
          (deleteTask)="deleteTask.emit($event)"
        />
      }
    </div>
  `,
  styles: `
    .kanban-board {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scroll-snap-type: x proximity;
    }

    .kanban-board > * {
      scroll-snap-align: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly statusChange = output<{ taskId: string; status: import('@features/tasks/models/task.enums').TaskStatus }>();
  readonly openTask = output<string>();
  readonly editTask = output<string>();
  readonly deleteTask = output<string>();

  readonly store = inject(TaskStore);
  readonly columns = BOARD_COLUMN_STATUSES;

  readonly dropListIds = computed(() => this.columns.map((status) => `kanban-${status}`));

  tasksFor(status: (typeof BOARD_COLUMN_STATUSES)[number]) {
    return this.store.boardGroups()[status] ?? [];
  }
}
