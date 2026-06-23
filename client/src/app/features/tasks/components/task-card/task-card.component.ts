import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { animate, style, transition, trigger } from '@angular/animations';
import { TaskAssigneesComponent } from '@features/tasks/components/task-assignees/task-assignees.component';
import { TaskLabelChipComponent } from '@features/tasks/components/task-labels/task-label-chip.component';
import { TaskPriorityComponent } from '@features/tasks/components/task-priority/task-priority.component';
import { TaskProgressComponent } from '@features/tasks/components/task-progress/task-progress.component';
import { isOverdue, summaryChecklistProgress } from '@features/tasks/models/task.utils';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-card',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TaskPriorityComponent,
    TaskAssigneesComponent,
    TaskLabelChipComponent,
    TaskProgressComponent,
  ],
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  host: { '[@cardEnter]': '' },
  template: `
    <article
      class="task-card"
      [class.task-card--overdue]="overdue()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'Open task ' + task().title"
      (click)="open.emit(task().id)"
      (keydown.enter)="open.emit(task().id)"
    >
      <div class="task-card__header">
        <app-task-priority [priority]="task().priority" />
        <button
          mat-icon-button
          type="button"
          class="task-card__menu"
          [attr.aria-label]="'Actions for ' + task().title"
          (click)="$event.stopPropagation()"
          [matMenuTriggerFor]="menu"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button" (click)="open.emit(task().id)">Open</button>
          @if (canEdit()) {
            <button mat-menu-item type="button" (click)="edit.emit(task().id)">Edit</button>
          }
          @if (canDelete()) {
            <button mat-menu-item type="button" (click)="delete.emit(task().id)">Delete</button>
          }
        </mat-menu>
      </div>

      <h4 class="task-card__title">{{ task().title }}</h4>

      @if (task().labels?.length) {
        <div class="task-card__labels">
          @for (label of task().labels!.slice(0, 3); track label.id) {
            <app-task-label-chip [name]="label.name" [color]="label.color" />
          }
        </div>
      }

      <div class="task-card__meta">
        @if (task().dueDate) {
          <span class="task-card__due" [class.task-card__due--overdue]="overdue()">
            <mat-icon aria-hidden="true">event</mat-icon>
            {{ task().dueDate | date: 'MMM d' }}
          </span>
        }
        @if (task().storyPoints != null) {
          <span class="task-card__points">{{ task().storyPoints }} pts</span>
        }
      </div>

      @if (checklistProgress() > 0) {
        <app-task-progress [value]="checklistProgress()" [showLabel]="false" />
      }

      <div class="task-card__footer">
        <app-task-assignees [assignees]="task().assignees ?? []" [maxVisible]="3" />
      </div>
    </article>
  `,
  styles: `
    .task-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      transition: box-shadow 180ms ease, transform 180ms ease;
    }

    .task-card:hover,
    .task-card:focus-visible {
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
      outline: none;
    }

    .task-card--overdue {
      border-color: color-mix(in srgb, var(--mat-sys-error) 40%, var(--mat-sys-outline-variant));
    }

    .task-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .task-card__menu {
      margin-left: auto;
    }

    .task-card__title {
      margin: 0;
      font: var(--mat-sys-title-small);
      line-height: 1.3;
    }

    .task-card__labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .task-card__meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .task-card__due {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .task-card__due mat-icon {
      font-size: 0.875rem;
      width: 0.875rem;
      height: 0.875rem;
    }

    .task-card__due--overdue {
      color: var(--mat-sys-error);
    }

    .task-card__footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly open = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  overdue() {
    return isOverdue(this.task());
  }

  checklistProgress() {
    const task = this.task();
    if (task.checklists?.length) {
      const completed = task.checklists.filter((item) => item.isCompleted).length;
      return Math.round((completed / task.checklists.length) * 100);
    }
    return summaryChecklistProgress(task.summary);
  }
}
