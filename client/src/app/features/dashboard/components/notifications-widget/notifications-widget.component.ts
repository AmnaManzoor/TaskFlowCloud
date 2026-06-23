import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { formatRelativeTime } from '@features/dashboard/models/dashboard.utils';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-notifications-widget',
  imports: [
    DashboardWidgetComponent,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  template: `
    <app-dashboard-widget
      title="Notifications"
      [subtitle]="unreadLabel()"
      icon="notifications"
      actionLabel="View all"
      [loading]="store.loading()"
      [empty]="store.notifications().length === 0"
      emptyTitle="All caught up"
      emptyDescription="New notifications will appear here."
    >
      <div class="notifications" role="list" aria-label="Recent notifications">
        @for (notification of store.notifications(); track notification.id) {
          <article
            class="notifications__item"
            [class.notifications__item--unread]="!notification.isRead"
            role="listitem"
          >
            <div class="notifications__content">
              <h3 class="notifications__title">{{ notification.title }}</h3>
              <p class="notifications__message">{{ notification.message }}</p>
              <time class="notifications__time" [dateTime]="notification.createdAt">
                {{ formatRelativeTime(notification.createdAt) }}
              </time>
            </div>
            @if (!notification.isRead) {
              <button
                mat-icon-button
                type="button"
                aria-label="Mark notification as read"
                (click)="store.markNotificationRead(notification.id)"
              >
                <mat-icon>done</mat-icon>
              </button>
            }
          </article>
        }
      </div>

      <div class="notifications__footer">
        <button mat-button type="button" (click)="store.markAllNotificationsRead()">Mark all read</button>
        <a mat-button routerLink="/notifications">Notification center</a>
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .notifications {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .notifications__item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.875rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-lowest);
    }

    .notifications__item--unread {
      border-left: 3px solid var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }

    .notifications__title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .notifications__message {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .notifications__time {
      display: block;
      margin-top: 0.375rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .notifications__footer {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsWidgetComponent {
  readonly store = inject(DashboardStore);
  readonly formatRelativeTime = formatRelativeTime;

  unreadLabel(): string {
    const count = this.store.unreadCount();
    return count > 0 ? `${count} unread` : 'You are all caught up';
  }
}
