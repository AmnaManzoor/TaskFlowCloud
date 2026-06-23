import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TaskPriorityComponent } from '@features/tasks/components/task-priority/task-priority.component';
import { TaskStatusComponent } from '@features/tasks/components/task-status/task-status.component';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-header',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TaskStatusComponent, TaskPriorityComponent],
  template: `
    <header class="task-header">
      <div class="task-header__main">
        <button mat-icon-button type="button" aria-label="Close task details" (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
        <div class="task-header__titles">
          <h2>{{ task().title }}</h2>
          <div class="task-header__chips">
            <app-task-status [status]="task().status" />
            <app-task-priority [priority]="task().priority" />
          </div>
        </div>
      </div>

      <div class="task-header__actions">
        @if (canEdit()) {
          <button mat-stroked-button type="button" (click)="edit.emit()">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        }
        <button mat-icon-button type="button" [matMenuTriggerFor]="menu" aria-label="More actions">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          @if (canEdit()) {
            <button mat-menu-item type="button" (click)="changeStatus.emit()">Change status</button>
            <button mat-menu-item type="button" (click)="move.emit()">Move to project</button>
          }
          @if (canDelete()) {
            <button mat-menu-item type="button" (click)="delete.emit()">Delete</button>
          }
        </mat-menu>
      </div>
    </header>
  `,
  styles: `
    .task-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .task-header__main {
      display: flex;
      gap: 0.5rem;
      min-width: 0;
    }

    .task-header__titles h2 {
      margin: 0 0 0.5rem;
      font: var(--mat-sys-headline-small);
    }

    .task-header__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .task-header__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskHeaderComponent {
  readonly task = input.required<Task>();
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly changeStatus = output<void>();
  readonly move = output<void>();
}
