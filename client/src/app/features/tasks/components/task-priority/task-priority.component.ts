import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { taskPriorityLabel, taskPriorityLevel } from '@features/tasks/models/task.utils';
import { TaskPriority } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-priority',
  imports: [PriorityBadgeComponent],
  template: `<app-priority-badge [level]="level()" [label]="label()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPriorityComponent {
  readonly priority = input.required<TaskPriority>();

  label() {
    return taskPriorityLabel(this.priority());
  }

  level() {
    return taskPriorityLevel(this.priority());
  }
}
