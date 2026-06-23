import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [class]="'badge--' + variant()" role="status">
      {{ label() }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
    }

    .badge--success {
      background: #e8f5e9;
      color: #1b5e20;
    }

    .badge--warning {
      background: #fff8e1;
      color: #f57f17;
    }

    .badge--error {
      background: #ffebee;
      color: #b71c1c;
    }

    .badge--info {
      background: #e3f2fd;
      color: #0d47a1;
    }

    :host-context(.theme-dark) .badge--success {
      background: #1b5e20;
      color: #e8f5e9;
    }

    :host-context(.theme-dark) .badge--warning {
      background: #f57f17;
      color: #fff8e1;
    }

    :host-context(.theme-dark) .badge--error {
      background: #b71c1c;
      color: #ffebee;
    }

    :host-context(.theme-dark) .badge--info {
      background: #0d47a1;
      color: #e3f2fd;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly variant = input<StatusVariant>('default');
}
