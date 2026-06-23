import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { taskStatusLabel, taskStatusVariant } from '@features/tasks/models/task.utils';
import { TaskStatus } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-status',
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [label]="label()" [variant]="variant()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskStatusComponent {
  readonly status = input.required<TaskStatus>();

  label() {
    return taskStatusLabel(this.status());
  }

  variant() {
    return taskStatusVariant(this.status());
  }
}
