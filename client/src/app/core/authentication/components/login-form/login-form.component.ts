import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/authentication/services/auth.service';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import {
  emailValidators,
  getControlErrorMessage,
  passwordValidators,
} from '@core/authentication/validators/auth.validators';
import { PasswordInputComponent } from '@core/authentication/components/password-input/password-input.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { AutofocusDirective } from '@shared/directives/autofocus.directive';

@Component({
  selector: 'app-login-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    PasswordInputComponent,
    LoadingButtonComponent,
    AutofocusDirective,
  ],
  template: `
    <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
        <mat-label>Work email</mat-label>
        <mat-icon matPrefix aria-hidden="true">mail_outline</mat-icon>
        <input matInput type="email" formControlName="email" autocomplete="email" [appAutofocus]="true" />
        @if (emailError(); as message) {
          <mat-error>{{ message }}</mat-error>
        } @else if (form.controls.email.valid && form.controls.email.value) {
          <mat-hint class="auth-form__hint auth-form__hint--valid">Looks good</mat-hint>
        }
      </mat-form-field>

      <app-password-input
        [control]="form.controls.password"
        label="Password"
        autocomplete="current-password"
        [errorMessage]="passwordError()"
      />

      <div class="auth-form__row">
        <mat-checkbox formControlName="rememberMe" color="primary">Remember me</mat-checkbox>
        <a class="auth-form__link" routerLink="/forgot-password">Forgot password?</a>
      </div>

      <app-loading-button type="submit" [loading]="authStore.isLoading()" [fullWidth]="true">
        Sign in
      </app-loading-button>
    </form>
  `,
  styles: `
    mat-icon[matPrefix] {
      margin-right: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .auth-form__hint--valid {
      color: var(--mat-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly authStore = inject(AuthStore);
  readonly loginSuccess = output<void>();

  readonly form = this.fb.nonNullable.group({
    email: ['', emailValidators],
    password: ['', passwordValidators],
    rememberMe: [true],
  });

  protected emailError(): string | null {
    return getControlErrorMessage(this.form.controls.email, 'Email');
  }

  protected passwordError(): string | null {
    return getControlErrorMessage(this.form.controls.password, 'Password');
  }

  protected submit(): void {
    this.authStore.setError(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();

    this.authService.login({ email, password }, rememberMe).subscribe({
      next: () => {
        this.notifications.success('Welcome back!');
        this.loginSuccess.emit();
      },
      error: (error) => {
        const message = extractApiErrorMessage(error, 'Sign in failed.');
        this.authStore.setError(message);
        this.notifications.error(message);
      },
    });
  }
}
