import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-page-shell',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <header class="auth-page__header">
        <h2 class="auth-page__title">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="auth-page__subtitle">{{ subtitle() }}</p>
        }
      </header>

      <ng-content />

      @if (footerText() && footerLink()) {
        <footer class="auth-page__footer">
          {{ footerText() }}
          <a [routerLink]="footerLink()">{{ footerLinkLabel() }}</a>
        </footer>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly footerText = input<string | undefined>(undefined);
  readonly footerLink = input<string | undefined>(undefined);
  readonly footerLinkLabel = input('Sign in');
}
