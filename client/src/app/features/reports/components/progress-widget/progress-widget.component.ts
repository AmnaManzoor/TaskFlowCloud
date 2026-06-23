import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-widget',
  imports: [MatProgressBarModule],
  template: `
    <div class="progress-widget" role="group" [attr.aria-label]="label()">
      <div class="progress-widget__header">
        <span>{{ label() }}</span>
        <strong>{{ value() }}%</strong>
      </div>
      <mat-progress-bar mode="determinate" [value]="value()" />
    </div>
  `,
  styles: `
    .progress-widget__header { display: flex; justify-content: space-between; margin-bottom: 0.375rem; font: var(--mat-sys-label-large); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressWidgetComponent {
  readonly label = input.required<string>();
  readonly value = input(0);
}
