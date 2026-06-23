import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';
import { projectProgressPercent } from '@features/projects/models/project.utils';
import type { Project } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-progress',
  imports: [ProgressBarComponent],
  template: `<app-progress-bar [value]="progress()" [showLabel]="showLabel()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProgressComponent {
  readonly project = input.required<Project>();
  readonly showLabel = input(true);

  progress(): number {
    return projectProgressPercent(this.project());
  }
}
