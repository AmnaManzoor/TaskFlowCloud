import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TaskProgressComponent } from '@features/tasks/components/task-progress/task-progress.component';
import { remainingHours, timeTrackingProgress } from '@features/tasks/models/task.utils';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-time-tracking',
  imports: [TaskProgressComponent, DecimalPipe],
  template: `
    <section class="time-tracking" aria-label="Time tracking">
      <div class="time-tracking__stats">
        <div class="time-tracking__stat">
          <span class="time-tracking__label">Estimated</span>
          <strong>{{ task().estimatedHours != null ? (task().estimatedHours | number: '1.0-1') : '—' }}h</strong>
        </div>
        <div class="time-tracking__stat">
          <span class="time-tracking__label">Actual</span>
          <strong>{{ task().actualHours != null ? (task().actualHours | number: '1.0-1') : '—' }}h</strong>
        </div>
        <div class="time-tracking__stat">
          <span class="time-tracking__label">Remaining</span>
          <strong>{{ remaining() ?? '—' }}{{ remaining() != null ? 'h' : '' }}</strong>
        </div>
      </div>
      <app-task-progress [value]="progress()" />
    </section>
  `,
  styles: `
    .time-tracking__stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .time-tracking__stat {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-low);
    }

    .time-tracking__label {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTimeTrackingComponent {
  readonly task = input.required<Task>();

  progress() {
    return timeTrackingProgress(this.task());
  }

  remaining() {
    return remainingHours(this.task());
  }
}
