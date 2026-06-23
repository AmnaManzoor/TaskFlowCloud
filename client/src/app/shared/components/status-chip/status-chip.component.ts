import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import {
  projectStatusLabel,
  projectStatusVariant,
  taskStatusLabel,
  taskStatusVariant,
} from '@features/dashboard/models/dashboard.utils';
import { ProjectStatus, TaskStatus } from '@features/dashboard/models/dashboard.models';

@Component({
  selector: 'app-status-chip',
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [label]="label()" [variant]="variant()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  readonly taskStatus = input<TaskStatus | undefined>(undefined);
  readonly projectStatus = input<ProjectStatus | undefined>(undefined);
  readonly customLabel = input<string | undefined>(undefined);

  label() {
    if (this.customLabel()) {
      return this.customLabel()!;
    }
    const task = this.taskStatus();
    if (task !== undefined) {
      return taskStatusLabel(task);
    }
    const project = this.projectStatus();
    if (project !== undefined) {
      return projectStatusLabel(project);
    }
    return 'Unknown';
  }

  variant() {
    const task = this.taskStatus();
    if (task !== undefined) {
      return taskStatusVariant(task);
    }
    const project = this.projectStatus();
    if (project !== undefined) {
      return projectStatusVariant(project);
    }
    return 'default' as const;
  }
}
