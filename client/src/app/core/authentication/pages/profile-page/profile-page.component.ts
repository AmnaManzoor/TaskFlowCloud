import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/authentication/services/auth.service';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { getControlErrorMessage } from '@core/authentication/validators/auth.validators';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-profile-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderComponent,
    UserAvatarComponent,
    SkeletonLoaderComponent,
    LoadingButtonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-page-header title="Profile" subtitle="View and update your account information" />

    @if (authStore.isLoading() && !authStore.user()) {
      <app-skeleton-loader [rows]="4" />
    } @else if (user(); as currentUser) {
      <div class="profile">
        <mat-card class="profile__summary">
          <div class="profile__avatar">
            <app-user-avatar
              [name]="currentUser.firstName + ' ' + currentUser.lastName"
              [imageUrl]="currentUser.profileImageUrl ?? undefined"
              [size]="72"
            />
            <p class="profile__placeholder">Profile image upload coming soon</p>
          </div>
          <div>
            <h2>{{ currentUser.firstName }} {{ currentUser.lastName }}</h2>
            <p>{{ currentUser.email }}</p>
            <app-status-badge
              [label]="currentUser.emailConfirmed ? 'Email verified' : 'Email not verified'"
              [variant]="currentUser.emailConfirmed ? 'success' : 'warning'"
            />
          </div>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Edit profile</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form class="profile__form" [formGroup]="form" (ngSubmit)="save()" novalidate>
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
                @if (firstNameError()) {
                  <mat-error>{{ firstNameError() }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
                @if (lastNameError()) {
                  <mat-error>{{ lastNameError() }}</mat-error>
                }
              </mat-form-field>

              <app-loading-button type="submit" [loading]="saving()">Save changes</app-loading-button>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/change-password">Change password</a>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: `
    .profile {
      display: grid;
      gap: 1.5rem;
    }

    .profile__summary {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      padding: 1.5rem;
    }

    .profile__avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .profile__placeholder {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }

    .profile__form {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly authStore = inject(AuthStore);
  protected readonly user = this.authStore.user;
  protected readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    profileImageUrl: [null as string | null],
  });

  constructor() {
    effect(() => {
      const currentUser = this.authStore.user();
      if (!currentUser) {
        return;
      }

      this.form.patchValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profileImageUrl: currentUser.profileImageUrl,
      });
    });
  }

  protected firstNameError(): string | null {
    return getControlErrorMessage(this.form.controls.firstName, 'First name');
  }

  protected lastNameError(): string | null {
    return getControlErrorMessage(this.form.controls.lastName, 'Last name');
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.authService.updateProfile(this.form.getRawValue()).subscribe({
      next: () => this.notifications.success('Profile updated successfully.'),
      error: (error) => {
        this.notifications.error(extractApiErrorMessage(error, 'Unable to update profile.'));
      },
      complete: () => this.saving.set(false),
    });
  }
}
