import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-summary-widget',
  template: `
    <section class="summary-widget" [attr.aria-label]="title()">
      <h3 class="summary-widget__title">{{ title() }}</h3>
      @if (subtitle()) {
        <p class="summary-widget__subtitle">{{ subtitle() }}</p>
      }
      <ng-content />
    </section>
  `,
  styles: `
    .summary-widget {
      padding: 1rem;
      border-radius: 0.875rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
    }
    .summary-widget__title { margin: 0; font: var(--mat-sys-title-medium); }
    .summary-widget__subtitle { margin: 0.25rem 0 0.75rem; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryWidgetComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
