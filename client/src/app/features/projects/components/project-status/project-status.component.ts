import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import {
  projectStatusLabel,
  projectStatusVariant,
} from '@features/projects/models/project.utils';
import { ProjectStatus } from '@features/projects/models/project.enums';

@Component({
  selector: 'app-project-status',
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [label]="projectStatusLabel(status())" [variant]="projectStatusVariant(status())" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStatusComponent {
  readonly status = input.required<ProjectStatus>();
  readonly projectStatusLabel = projectStatusLabel;
  readonly projectStatusVariant = projectStatusVariant;
}
