import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-widget-error',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="widget-error" role="alert">
      <mat-icon class="widget-error__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <h3 class="widget-error__title">{{ title() }}</h3>
      @if (message()) {
        <p class="widget-error__message">{{ message() }}</p>
      }
      @if (showRetry()) {
        <button mat-flat-button type="button" (click)="retry.emit()">
          <mat-icon aria-hidden="true">refresh</mat-icon>
          {{ retryLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .widget-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .widget-error__icon {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 2.5rem;
      color: var(--mat-sys-error);
    }

    .widget-error__title {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .widget-error__message {
      margin: 0;
      max-width: 28rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetErrorComponent {
  readonly icon = input('cloud_off');
  readonly title = input('Something went wrong');
  readonly message = input<string | null>(null);
  readonly showRetry = input(true);
  readonly retryLabel = input('Try again');

  readonly retry = output<void>();
}
