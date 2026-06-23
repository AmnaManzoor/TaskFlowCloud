import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/authentication/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import {
  getControlErrorMessage,
  passwordMatchValidator,
  passwordValidators,
} from '@core/authentication/validators/auth.validators';
import { PasswordInputComponent } from '@core/authentication/components/password-input/password-input.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { AuthPageShellComponent } from '@core/authentication/components/auth-page-shell/auth-page-shell.component';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    PasswordInputComponent,
    LoadingButtonComponent,
    AuthPageShellComponent,
  ],
  template: `
    <app-auth-page-shell
      title="Reset password"
      subtitle="Choose a strong new password for your account."
      footerText="Back to"
      footerLink="/login"
      footerLinkLabel="Sign in"
    >
      <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
          <mat-label>Email</mat-label>
          <mat-icon matPrefix aria-hidden="true">mail_outline</mat-icon>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (emailError(); as message) {
            <mat-error>{{ message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
          <mat-label>Reset code</mat-label>
          <mat-icon matPrefix aria-hidden="true">vpn_key</mat-icon>
          <input matInput formControlName="token" autocomplete="one-time-code" />
          @if (tokenError(); as message) {
            <mat-error>{{ message }}</mat-error>
          }
        </mat-form-field>

        <app-password-input
          [control]="form.controls.newPassword"
          label="New password"
          autocomplete="new-password"
          [showStrength]="true"
          [errorMessage]="newPasswordError()"
        />

        <app-password-input
          [control]="form.controls.confirmNewPassword"
          label="Confirm new password"
          autocomplete="new-password"
          [errorMessage]="confirmPasswordError()"
        />

        <app-loading-button type="submit" [loading]="loading()" [fullWidth]="true">
          Reset password
        </app-loading-button>
      </form>
    </app-auth-page-shell>
  `,
  styles: `
    mat-icon[matPrefix] {
      margin-right: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
      token: [this.route.snapshot.queryParamMap.get('token') ?? '', [Validators.required]],
      newPassword: ['', passwordValidators],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmNewPassword') },
  );

  protected emailError(): string | null {
    return getControlErrorMessage(this.form.controls.email, 'Email');
  }

  protected tokenError(): string | null {
    return getControlErrorMessage(this.form.controls.token, 'Reset code');
  }

  protected newPasswordError(): string | null {
    return getControlErrorMessage(this.form.controls.newPassword, 'New password');
  }

  protected confirmPasswordError(): string | null {
    if (this.form.errors?.['passwordMismatch'] && this.form.controls.confirmNewPassword.touched) {
      return 'Passwords do not match.';
    }

    return getControlErrorMessage(this.form.controls.confirmNewPassword, 'Confirm password');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const { email, token, newPassword, confirmNewPassword } = this.form.getRawValue();
    this.loading.set(true);

    this.authService.resetPassword({ email, token, newPassword, confirmNewPassword }).subscribe({
      next: () => {
        this.notifications.success('Password reset successfully. You can sign in now.');
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Password reset failed.'));
      },
      complete: () => this.loading.set(false),
    });
  }
}
