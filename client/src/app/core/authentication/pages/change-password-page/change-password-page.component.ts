import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-change-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    PasswordInputComponent,
    LoadingButtonComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Change password" subtitle="Update your account password" />

    <mat-card>
      <mat-card-content>
        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-password-input
            [control]="form.controls.currentPassword"
            label="Current password"
            autocomplete="current-password"
            [errorMessage]="currentPasswordError()"
          />

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

          <app-loading-button type="submit" [loading]="loading()">Update password</app-loading-button>
        </form>
      </mat-card-content>
      <mat-card-actions align="end">
        <a routerLink="/profile">Back to profile</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 28rem;
    }

    app-password-input,
    app-loading-button {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', passwordValidators],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmNewPassword') },
  );

  protected currentPasswordError(): string | null {
    return getControlErrorMessage(this.form.controls.currentPassword, 'Current password');
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

    this.loading.set(true);
    this.authService.changePassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Password changed successfully.');
        this.form.reset();
      },
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Unable to change password.'));
      },
      complete: () => this.loading.set(false),
    });
  }
}
