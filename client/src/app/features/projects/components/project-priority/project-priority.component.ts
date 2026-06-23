import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import {
  projectPriorityLabel,
  projectPriorityLevel,
} from '@features/projects/models/project.utils';
import { ProjectPriority } from '@features/projects/models/project.enums';

@Component({
  selector: 'app-project-priority',
  imports: [PriorityBadgeComponent],
  template: `
    <app-priority-badge [level]="projectPriorityLevel(priority())" [label]="projectPriorityLabel(priority())" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPriorityComponent {
  readonly priority = input.required<ProjectPriority>();
  readonly projectPriorityLabel = projectPriorityLabel;
  readonly projectPriorityLevel = projectPriorityLevel;
}
