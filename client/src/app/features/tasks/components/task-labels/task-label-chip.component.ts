import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-task-label-chip',
  template: `
    <span class="label-chip" [style.background]="background()" [attr.aria-label]="name()">
      {{ name() }}
    </span>
  `,
  styles: `
    .label-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font: var(--mat-sys-label-small);
      color: #fff;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskLabelChipComponent {
  readonly name = input.required<string>();
  readonly color = input('#6B7280');

  background() {
    return this.color();
  }
}
