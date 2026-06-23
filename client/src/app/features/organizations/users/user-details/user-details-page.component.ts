import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { AuthStore } from '@core/stores/auth.store';
import { UserStore } from '@features/organizations/stores/user.store';
import { canManageUsers } from '@features/organizations/utils/permissions.util';

@Component({
  selector: 'app-user-details-page',
  imports: [
    BreadcrumbComponent,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    RouterLink,
    StatusBadgeComponent,
    UserAvatarComponent,
    SkeletonLoaderComponent,
    DatePipe,
  ],
  template: `
    <app-breadcrumb [items]="breadcrumbs()" />

    @if (store.loading()) {
      <app-skeleton-loader [rows]="5" />
    } @else if (store.selected(); as user) {
      <mat-card class="user-detail">
        <div class="user-detail__header">
          <app-user-avatar
            [name]="user.firstName + ' ' + user.lastName"
            [imageUrl]="user.profileImageUrl ?? undefined"
            [size]="72"
          />
          <div>
            <h1>{{ user.firstName }} {{ user.lastName }}</h1>
            <p>{{ user.email }}</p>
            <app-status-badge
              [label]="user.isActive ? (user.isLockedOut ? 'Locked' : 'Active') : 'Inactive'"
              [variant]="user.isActive && !user.isLockedOut ? 'success' : 'warning'"
            />
          </div>
        </div>

        <mat-card-content>
          <h2>System roles</h2>
          <mat-chip-set aria-label="System roles">
            @for (role of user.systemRoles; track role) {
              <mat-chip>{{ role }}</mat-chip>
            } @empty {
              <span>No system roles assigned</span>
            }
          </mat-chip-set>

          <dl class="user-detail__meta">
            <div><dt>Created</dt><dd>{{ user.createdAt | date: 'medium' }}</dd></div>
            <div><dt>Last login</dt><dd>{{ user.lastLoginAt ? (user.lastLoginAt | date: 'medium') : 'Never' }}</dd></div>
            <div><dt>Email confirmed</dt><dd>{{ user.emailConfirmed ? 'Yes' : 'No' }}</dd></div>
          </dl>
        </mat-card-content>

        <mat-card-actions>
          <a mat-button [routerLink]="['profile']">Edit profile</a>
          @if (canManage()) {
            @if (user.isActive) {
              <button mat-button type="button" (click)="confirmAction('deactivate')">Deactivate</button>
            } @else {
              <button mat-button type="button" (click)="store.activate(user.id)">Activate</button>
            }
            @if (user.isLockedOut) {
              <button mat-button type="button" (click)="store.unlock(user.id)">Unlock</button>
            } @else {
              <button mat-button type="button" (click)="confirmAction('lock')">Lock</button>
            }
          }
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: `
    .user-detail__header {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1rem 0;
    }

    .user-detail__header h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .user-detail__header p {
      margin: 0.25rem 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .user-detail__meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .user-detail__meta dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .user-detail__meta dd {
      margin: 0.125rem 0 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsPageComponent implements OnInit {
  readonly userId = input.required<string>({ alias: 'userId' });
  readonly store = inject(UserStore);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.store.loadById(this.userId());
  }

  breadcrumbs() {
    const user = this.store.selected();
    return [
      { label: 'Users', route: '/users' },
      { label: user ? `${user.firstName} ${user.lastName}` : 'User' },
    ];
  }

  canManage(): boolean {
    return canManageUsers(this.authStore.roles());
  }

  confirmAction(action: 'deactivate' | 'lock'): void {
    const user = this.store.selected();
    if (!user) return;

    const isDeactivate = action === 'deactivate';
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: isDeactivate ? 'Deactivate user' : 'Lock user',
          message: isDeactivate
            ? `Deactivate ${user.firstName} ${user.lastName}? They will lose access to the application.`
            : `Lock ${user.firstName} ${user.lastName}? They will be unable to sign in.`,
          confirmLabel: isDeactivate ? 'Deactivate' : 'Lock',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        if (isDeactivate) {
          this.store.deactivate(user.id);
        } else {
          this.store.lock(user.id);
        }
      });
  }
}
