import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import {
  projectPriorityLevel,
  taskPriorityLabel,
  taskPriorityLevel,
} from '@features/dashboard/models/dashboard.utils';
import { ProjectPriority, TaskPriority } from '@features/dashboard/models/dashboard.models';

@Component({
  selector: 'app-priority-chip',
  imports: [PriorityBadgeComponent],
  template: `<app-priority-badge [level]="level()" [label]="label()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityChipComponent {
  readonly taskPriority = input<TaskPriority | undefined>(undefined);
  readonly projectPriority = input<ProjectPriority | undefined>(undefined);

  label() {
    const task = this.taskPriority();
    if (task !== undefined) {
      return taskPriorityLabel(task);
    }
    const project = this.projectPriority();
    if (project !== undefined) {
      return taskPriorityLabel(project as unknown as TaskPriority);
    }
    return 'Medium';
  }

  level() {
    const task = this.taskPriority();
    if (task !== undefined) {
      return taskPriorityLevel(task);
    }
    const project = this.projectPriority();
    if (project !== undefined) {
      return projectPriorityLevel(project);
    }
    return 'medium' as const;
  }
}
