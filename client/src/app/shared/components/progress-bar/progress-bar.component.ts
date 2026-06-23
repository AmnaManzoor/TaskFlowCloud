import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="progress" role="progressbar" [attr.aria-valuenow]="value()" aria-valuemin="0" aria-valuemax="100">
      <div class="progress__track">
        <div class="progress__fill" [style.width.%]="clampedValue()"></div>
      </div>
      @if (showLabel()) {
        <span class="progress__label">{{ clampedValue() }}%</span>
      }
    </div>
  `,
  styles: `
    .progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress__track {
      flex: 1;
      height: 0.5rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;
    }

    .progress__fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--mat-sys-primary), #38bdf8);
      transition: width 320ms ease;
    }

    .progress__label {
      min-width: 2.5rem;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
      text-align: right;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly value = input(0);
  readonly showLabel = input(true);

  readonly clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
}
