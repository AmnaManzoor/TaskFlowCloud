import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  passwordMatchValidator,
  passwordValidators,
} from '@core/authentication/validators/auth.validators';
import { PasswordInputComponent } from '@core/authentication/components/password-input/password-input.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';

@Component({
  selector: 'app-register-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    PasswordInputComponent,
    LoadingButtonComponent,
  ],
  template: `
    <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="auth-form__grid">
        <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstName" autocomplete="given-name" />
          @if (firstNameError(); as message) {
            <mat-error>{{ message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
          <mat-label>Last name</mat-label>
          <input matInput formControlName="lastName" autocomplete="family-name" />
          @if (lastNameError(); as message) {
            <mat-error>{{ message }}</mat-error>
          }
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
        <mat-label>Work email</mat-label>
        <mat-icon matPrefix aria-hidden="true">mail_outline</mat-icon>
        <input matInput type="email" formControlName="email" autocomplete="email" />
        @if (emailError(); as message) {
          <mat-error>{{ message }}</mat-error>
        }
      </mat-form-field>

      <app-password-input
        [control]="form.controls.password"
        label="Password"
        autocomplete="new-password"
        [showStrength]="true"
        [errorMessage]="passwordError()"
      />

      <app-password-input
        [control]="form.controls.confirmPassword"
        label="Confirm password"
        autocomplete="new-password"
        [errorMessage]="confirmPasswordError()"
      />

      <app-loading-button type="submit" [loading]="authStore.isLoading()" [fullWidth]="true">
        Create account
      </app-loading-button>
    </form>
  `,
  styles: `
    mat-icon[matPrefix] {
      margin-right: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly authStore = inject(AuthStore);
  readonly registerSuccess = output<void>();

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', emailValidators],
      password: ['', passwordValidators],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') },
  );

  protected firstNameError(): string | null {
    return getControlErrorMessage(this.form.controls.firstName, 'First name');
  }

  protected lastNameError(): string | null {
    return getControlErrorMessage(this.form.controls.lastName, 'Last name');
  }

  protected emailError(): string | null {
    return getControlErrorMessage(this.form.controls.email, 'Email');
  }

  protected passwordError(): string | null {
    return getControlErrorMessage(this.form.controls.password, 'Password');
  }

  protected confirmPasswordError(): string | null {
    if (this.form.errors?.['passwordMismatch'] && this.form.controls.confirmPassword.touched) {
      return 'Passwords do not match.';
    }

    return getControlErrorMessage(this.form.controls.confirmPassword, 'Confirm password');
  }

  protected submit(): void {
    this.authStore.setError(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Account created successfully.');
        this.registerSuccess.emit();
      },
      error: (error) => {
        const message = extractApiErrorMessage(error, 'Registration failed.');
        this.authStore.setError(message);
        this.notifications.error(message);
      },
    });
  }
}
