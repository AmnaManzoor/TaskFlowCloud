import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <section class="error-page" role="alert">
      <mat-icon class="error-page__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <p class="error-page__code">{{ code() }}</p>
      <h1>{{ title() }}</h1>
      <p class="error-page__message">{{ message() }}</p>
      @if (showHomeLink()) {
        <a mat-flat-button routerLink="/dashboard">Go to dashboard</a>
      }
    </section>
  `,
  styles: `
    .error-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 0.75rem;
      text-align: center;
      padding: 2rem;
    }

    .error-page__icon {
      width: 4rem;
      height: 4rem;
      font-size: 4rem;
      color: var(--mat-sys-outline);
    }

    .error-page__code {
      margin: 0;
      font: var(--mat-sys-headline-large);
      color: var(--mat-sys-primary);
    }

    .error-page h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .error-page__message {
      margin: 0;
      max-width: 32rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageComponent {
  readonly code = input('404');
  readonly title = input('Page not found');
  readonly message = input('The page you are looking for does not exist.');
  readonly icon = input('search_off');
  readonly showHomeLink = input(true);
}
