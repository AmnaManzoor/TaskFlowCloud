import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-task-progress',
  imports: [ProgressBarComponent],
  template: `
    <app-progress-bar [value]="value()" [showLabel]="showLabel()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskProgressComponent {
  readonly value = input(0);
  readonly showLabel = input(true);
}
