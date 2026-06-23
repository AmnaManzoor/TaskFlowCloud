import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-button',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-flat-button
      [color]="color()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      [class.loading-button--full]="fullWidth()"
    >
      @if (loading()) {
        <mat-spinner diameter="20" aria-hidden="true" />
        <span class="loading-button__text loading-button__text--loading">{{ loadingLabel() }}</span>
      } @else {
        <span class="loading-button__text">
          @if (label()) {
            {{ label() }}
          } @else {
            <ng-content />
          }
        </span>
      }
    </button>
  `,
  styles: `
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-width: 7rem;
      min-height: 2.75rem;
      border-radius: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    button:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgb(0 0 0 / 12%);
    }

    button:disabled:not([aria-busy='true']) {
      opacity: 0.55;
    }

    .loading-button--full {
      width: 100%;
    }

    .loading-button__text {
      display: inline-flex;
      align-items: center;
    }

    .loading-button__text--loading {
      opacity: 0.9;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingButtonComponent {
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly fullWidth = input(false);
  readonly loadingLabel = input('Please wait…');
  readonly label = input('');

  readonly pressed = output<void>();
}
