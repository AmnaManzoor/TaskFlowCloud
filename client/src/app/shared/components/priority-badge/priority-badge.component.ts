import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-priority-badge',
  template: `
    <span class="priority" [class]="'priority--' + level()" role="status">
      {{ label() }}
    </span>
  `,
  styles: `
    .priority {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 0.375rem;
      font: var(--mat-sys-label-medium);
      text-transform: capitalize;
    }

    .priority--low {
      background: #eceff1;
      color: #455a64;
    }

    .priority--medium {
      background: #e3f2fd;
      color: #1565c0;
    }

    .priority--high {
      background: #fff3e0;
      color: #ef6c00;
    }

    .priority--critical {
      background: #ffebee;
      color: #c62828;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly level = input<PriorityLevel>('medium');
  readonly label = input('Medium');
}
