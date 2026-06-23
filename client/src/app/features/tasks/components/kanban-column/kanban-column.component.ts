import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaskCardComponent } from '@features/tasks/components/task-card/task-card.component';
import { taskStatusLabel } from '@features/tasks/models/task.utils';
import { TaskStatus } from '@features/tasks/models/task.enums';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-kanban-column',
  imports: [DragDropModule, MatButtonModule, MatIconModule, TaskCardComponent],
  template: `
    <section
      class="kanban-column"
      [class.kanban-column--collapsed]="collapsed()"
      [attr.aria-label]="statusLabel() + ' column'"
    >
      <header class="kanban-column__header">
        <div class="kanban-column__title">
          <span class="kanban-column__dot" [attr.data-status]="status()"></span>
          <h3>{{ statusLabel() }}</h3>
          <span class="kanban-column__count">{{ tasks().length }}</span>
        </div>
        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="collapsed() ? 'Expand column' : 'Collapse column'"
          (click)="toggleCollapsed()"
        >
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </header>

      @if (!collapsed()) {
        <div
          class="kanban-column__body"
          cdkDropList
          [id]="dropListId()"
          [cdkDropListData]="tasks()"
          [cdkDropListConnectedTo]="connectedTo()"
          (cdkDropListDropped)="onDrop($event)"
        >
          @for (task of tasks(); track task.id) {
            <div class="kanban-column__card" cdkDrag [cdkDragData]="task">
              <app-task-card
                [task]="task"
                [canEdit]="canEdit()"
                [canDelete]="canDelete()"
                (open)="openTask.emit($event)"
                (edit)="editTask.emit($event)"
                (delete)="deleteTask.emit($event)"
              />
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .kanban-column {
      display: flex;
      flex-direction: column;
      min-width: 18rem;
      max-width: 20rem;
      flex: 0 0 auto;
      background: var(--mat-sys-surface-container-low);
      border-radius: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .kanban-column--collapsed {
      min-width: 3rem;
      max-width: 3rem;
    }

    .kanban-column__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .kanban-column__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .kanban-column__title h3 {
      margin: 0;
      font: var(--mat-sys-title-small);
      white-space: nowrap;
    }

    .kanban-column--collapsed .kanban-column__title h3,
    .kanban-column--collapsed .kanban-column__count {
      display: none;
    }

    .kanban-column__dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      background: var(--mat-sys-primary);
      flex-shrink: 0;
    }

    .kanban-column__count {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container-high);
      border-radius: 999px;
      padding: 0.125rem 0.5rem;
    }

    .kanban-column__body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
      min-height: 12rem;
      max-height: calc(100vh - 16rem);
      overflow-y: auto;
    }

    .kanban-column__card.cdk-drag-preview {
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
    }

    .kanban-column__card.cdk-drag-placeholder {
      opacity: 0.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
  readonly status = input.required<TaskStatus>();
  readonly tasks = input<Task[]>([]);
  readonly connectedTo = input<string[]>([]);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly statusChange = output<{ taskId: string; status: TaskStatus }>();
  readonly openTask = output<string>();
  readonly editTask = output<string>();
  readonly deleteTask = output<string>();
  readonly tasksReordered = output<{ status: TaskStatus; tasks: Task[] }>();

  readonly collapsed = signal(false);

  dropListId() {
    return `kanban-${this.status()}`;
  }

  statusLabel() {
    return taskStatusLabel(this.status());
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.tasksReordered.emit({ status: this.status(), tasks: [...event.container.data] });
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    if (task && task.status !== this.status()) {
      this.statusChange.emit({ taskId: task.id, status: this.status() });
    }
  }
}
