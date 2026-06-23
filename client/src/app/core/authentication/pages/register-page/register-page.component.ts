import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterFormComponent } from '@core/authentication/components/register-form/register-form.component';
import { AuthPageShellComponent } from '@core/authentication/components/auth-page-shell/auth-page-shell.component';
import { AuthStore } from '@core/authentication/stores/auth.store';

@Component({
  selector: 'app-register-page',
  imports: [RegisterFormComponent, AuthPageShellComponent],
  template: `
    <app-auth-page-shell
      title="Create your account"
      subtitle="Start managing projects and tasks in minutes."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkLabel="Sign in"
    >
      @if (authStore.error(); as errorMessage) {
        <div class="auth-form__alert auth-form__alert--error" role="alert">
          {{ errorMessage }}
        </div>
      }

      <app-register-form (registerSuccess)="onRegisterSuccess()" />
    </app-auth-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  protected onRegisterSuccess(): void {
    void this.router.navigate(['/dashboard']);
  }
}
