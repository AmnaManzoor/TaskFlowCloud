import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner" [class.spinner--overlay]="overlay()" role="status" aria-live="polite">
      <mat-progress-spinner [diameter]="diameter()" mode="indeterminate" />
      @if (label()) {
        <span class="spinner__label">{{ label() }}</span>
      }
    </div>
  `,
  styles: `
    .spinner {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .spinner--overlay {
      position: fixed;
      inset: 0;
      z-index: 1200;
      justify-content: center;
      background: rgb(0 0 0 / 20%);
    }

    .spinner__label {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  readonly diameter = input(48);
  readonly overlay = input(false);
  readonly label = input<string | undefined>(undefined);
}
