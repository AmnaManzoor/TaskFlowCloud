import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  selector: 'app-verify-email-page',
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
      title="Verify your email"
      subtitle="Enter the verification code sent to your inbox."
      footerText="Back to"
      footerLink="/login"
      footerLinkLabel="Sign in"
    >
      @if (verified()) {
        <div class="auth-form__alert auth-form__alert--success" role="status">
          Your email has been verified successfully. You can sign in now.
        </div>
      } @else {
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
            <mat-label>Verification code</mat-label>
            <mat-icon matPrefix aria-hidden="true">mark_email_read</mat-icon>
            <input matInput formControlName="token" autocomplete="one-time-code" />
            @if (tokenError(); as message) {
              <mat-error>{{ message }}</mat-error>
            }
          </mat-form-field>

          <app-loading-button type="submit" [loading]="loading()" [fullWidth]="true">
            Verify email
          </app-loading-button>
        </form>

        <button type="button" class="auth-form__link auth-form__link--button" (click)="resend()" [disabled]="loading()">
          Resend verification email
        </button>
      }
    </app-auth-page-shell>
  `,
  styles: `
    mat-icon[matPrefix] {
      margin-right: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .auth-form__link--button {
      margin-top: 0.5rem;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly verified = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', emailValidators],
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', [Validators.required]],
  });

  protected emailError(): string | null {
    return getControlErrorMessage(this.form.controls.email, 'Email');
  }

  protected tokenError(): string | null {
    return getControlErrorMessage(this.form.controls.token, 'Verification code');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.verifyEmail(this.form.getRawValue()).subscribe({
      next: () => {
        this.verified.set(true);
        this.notifications.success('Email verified successfully.');
      },
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Email verification failed.'));
      },
      complete: () => this.loading.set(false),
    });
  }

  protected resend(): void {
    const email = this.form.controls.email.value;
    if (!email) {
      this.form.controls.email.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService.resendVerification(email).subscribe({
      next: () => this.notifications.info('Verification email sent if the account exists.'),
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Unable to resend verification email.'));
      },
      complete: () => this.loading.set(false),
    });
  }
}
