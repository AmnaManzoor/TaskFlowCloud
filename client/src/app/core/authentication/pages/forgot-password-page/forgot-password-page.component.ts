import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/authentication/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { emailValidators, getControlErrorMessage } from '@core/authentication/validators/auth.validators';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { AuthPageShellComponent } from '@core/authentication/components/auth-page-shell/auth-page-shell.component';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LoadingButtonComponent,
    AuthPageShellComponent,
  ],
  template: `
    <app-auth-page-shell
      title="Forgot password?"
      subtitle="Enter your email and we'll send reset instructions if an account exists."
      footerText="Remember your password?"
      footerLink="/login"
      footerLinkLabel="Sign in"
    >
      @if (submitted()) {
        <div class="auth-form__alert auth-form__alert--success" role="status">
          If an account exists for that email, reset instructions have been sent.
        </div>
      } @else {
        <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <mat-form-field appearance="outline" class="auth-form__field" subscriptSizing="dynamic">
            <mat-label>Work email</mat-label>
            <mat-icon matPrefix aria-hidden="true">mail_outline</mat-icon>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            @if (emailError(); as message) {
              <mat-error>{{ message }}</mat-error>
            }
          </mat-form-field>
          <app-loading-button type="submit" [loading]="loading()" [fullWidth]="true">
            Send reset link
          </app-loading-button>
        </form>
      }
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
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', emailValidators],
  });

  protected emailError(): string | null {
    return getControlErrorMessage(this.form.controls.email, 'Email');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitted.set(true);
        this.notifications.success('Reset instructions sent if the account exists.');
      },
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Unable to process request.'));
      },
      complete: () => this.loading.set(false),
    });
  }
}
