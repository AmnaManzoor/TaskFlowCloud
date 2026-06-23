import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-date-separator',
  template: `
    <div class="date-separator" role="separator" [attr.aria-label]="label()">
      <span class="date-separator__line" aria-hidden="true"></span>
      <span class="date-separator__label">{{ label() }}</span>
      <span class="date-separator__line" aria-hidden="true"></span>
    </div>
  `,
  styles: `
    .date-separator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }

    .date-separator__line {
      flex: 1 1 auto;
      height: 1px;
      background: var(--mat-sys-outline-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateSeparatorComponent {
  readonly label = input.required<string>();
}
