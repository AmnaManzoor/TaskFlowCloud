import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginFormComponent } from '@core/authentication/components/login-form/login-form.component';
import { AuthPageShellComponent } from '@core/authentication/components/auth-page-shell/auth-page-shell.component';
import { AuthStore } from '@core/authentication/stores/auth.store';

@Component({
  selector: 'app-login-page',
  imports: [LoginFormComponent, AuthPageShellComponent],
  template: `
    <app-auth-page-shell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkLabel="Create one"
    >
      @if (authStore.error(); as errorMessage) {
        <div class="auth-form__alert auth-form__alert--error" role="alert">
          {{ errorMessage }}
        </div>
      }

      <app-login-form (loginSuccess)="onLoginSuccess()" />
    </app-auth-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authStore = inject(AuthStore);

  protected onLoginSuccess(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }
}
