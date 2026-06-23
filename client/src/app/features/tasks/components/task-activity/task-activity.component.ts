import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { activityIcon } from '@features/tasks/models/task.utils';
import { formatRelativeTime } from '@features/dashboard/models/dashboard.utils';
import type { ActivityHistoryItem } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-activity',
  imports: [MatIconModule],
  template: `
    <section class="task-activity" aria-label="Activity timeline">
      @if (items().length === 0) {
        <p class="task-activity__empty">No activity recorded yet.</p>
      } @else {
        <ol class="task-activity__list">
          @for (item of items(); track item.id) {
            <li class="task-activity__item">
              <div class="task-activity__icon" aria-hidden="true">
                <mat-icon>{{ icon(item.activityType) }}</mat-icon>
              </div>
              <div class="task-activity__content">
                <p class="task-activity__description">{{ item.description }}</p>
                <time class="task-activity__time" [dateTime]="item.createdAt">
                  {{ relativeTime(item.createdAt) }}
                </time>
              </div>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    .task-activity__empty {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .task-activity__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-activity__item {
      display: flex;
      gap: 0.75rem;
    }

    .task-activity__icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface-container-high);
      flex-shrink: 0;
    }

    .task-activity__icon mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .task-activity__description {
      margin: 0 0 0.25rem;
      font: var(--mat-sys-body-medium);
    }

    .task-activity__time {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskActivityComponent {
  readonly items = input<ActivityHistoryItem[]>([]);

  icon(activityType: string) {
    return activityIcon(activityType);
  }

  relativeTime(iso: string) {
    return formatRelativeTime(iso);
  }
}
