import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationFilterComponent } from '@features/notifications/components/notification-filter/notification-filter.component';
import { NotificationListComponent } from '@features/notifications/components/notification-list/notification-list.component';
import { NotificationToolbarComponent } from '@features/notifications/components/notification-toolbar/notification-toolbar.component';
import {
  NotificationSettingsDialogComponent,
  type NotificationSettingsDialogData,
} from '@features/notifications/dialogs/notification-settings-dialog.component';
import { NotificationsService } from '@features/notifications/services/notification.service';
import { NotificationStore } from '@features/notifications/stores/notification.store';
import type { NotificationItem } from '@features/notifications/models/notification.models';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { formatRelativeTime, getNotificationRoute } from '@features/notifications/models/notification.utils';

@Component({
  selector: 'app-notification-center-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    NotificationToolbarComponent,
    NotificationFilterComponent,
    NotificationListComponent,
  ],
  template: `
    <div class="notification-center">
      <app-notification-toolbar
        [unreadCount]="store.unreadCount()"
        [saving]="store.saving()"
        (refresh)="refresh()"
        (markAllRead)="store.markAllRead()"
        (deleteRead)="confirmDeleteRead()"
        (toggleFilters)="filtersVisible.set(!filtersVisible())"
        (openSettings)="openSettings()"
      />

      @if (filtersVisible()) {
        <app-notification-filter />
      }

      <div class="notification-center__layout">
        <app-notification-list
          class="notification-center__list"
          [selectedId]="store.selected()?.id ?? null"
          (selectedChange)="onSelect($event)"
          (markRead)="store.markRead($event)"
          (markUnread)="store.markUnread($event)"
          (delete)="store.delete($event)"
          (retry)="refresh()"
        />

        <aside class="notification-center__detail" aria-label="Notification details">
          @if (store.selected(); as selected) {
            <header class="notification-center__detail-header">
              <h3>{{ selected.title }}</h3>
              <time [dateTime]="selected.createdAt">{{ formatRelativeTime(selected.createdAt) }}</time>
            </header>
            <p>{{ selected.message }}</p>
            <div class="notification-center__detail-meta">
              <span>{{ selected.referenceType }}</span>
              <span>{{ selected.isRead ? 'Read' : 'Unread' }}</span>
            </div>
            <div class="notification-center__detail-actions">
              @if (detailRoute(selected); as route) {
                <a mat-flat-button color="primary" [routerLink]="route">Open related item</a>
              }
              @if (!selected.isRead) {
                <button mat-stroked-button type="button" (click)="store.markRead(selected.id)">
                  Mark read
                </button>
              } @else {
                <button mat-stroked-button type="button" (click)="store.markUnread(selected.id)">
                  Mark unread
                </button>
              }
              <button mat-stroked-button color="warn" type="button" (click)="store.delete(selected.id)">
                Delete
              </button>
            </div>
          } @else {
            <div class="notification-center__detail-empty">
              <mat-icon aria-hidden="true">notifications</mat-icon>
              <p>Select a notification to view details.</p>
            </div>
          }
        </aside>
      </div>

      <div class="notification-center__footer">
        <a mat-button routerLink="/notifications/activity">View activity center</a>
      </div>
    </div>
  `,
  styles: `
    .notification-center {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .notification-center__layout {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.8fr);
      gap: 1rem;
      align-items: start;
    }

    .notification-center__detail {
      position: sticky;
      top: 5rem;
      padding: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.875rem;
      background: var(--mat-sys-surface-container-lowest);
      min-height: 16rem;
    }

    .notification-center__detail-header h3 {
      margin: 0;
      font: var(--mat-sys-title-large);
    }

    .notification-center__detail-meta {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }

    .notification-center__detail-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .notification-center__detail-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 12rem;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }

    .notification-center__footer {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 960px) {
      .notification-center__layout {
        grid-template-columns: 1fr;
      }

      .notification-center__detail {
        position: static;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterPageComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);

  readonly store = inject(NotificationStore);
  readonly filtersVisible = signal(true);
  readonly formatRelativeTime = formatRelativeTime;

  ngOnInit(): void {
    this.store.loadInitial();
    this.notificationsService.refreshUnreadCount();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.loadById(id);
    }
  }

  refresh(): void {
    this.store.loadInitial();
    this.notificationsService.refreshUnreadCount();
  }

  onSelect(notification: NotificationItem): void {
    this.store.select(notification);
    if (!notification.isRead) {
      this.store.markRead(notification.id);
    }
    void this.router.navigate(['/notifications', notification.id]);
  }

  detailRoute(notification: NotificationItem): string | null {
    return getNotificationRoute(notification);
  }

  confirmDeleteRead(): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete read notifications',
          message: 'This will permanently delete all read notifications.',
          confirmLabel: 'Delete read',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.deleteAllRead();
        }
      });
  }

  openSettings(): void {
    this.dialog.open<NotificationSettingsDialogComponent, NotificationSettingsDialogData>(
      NotificationSettingsDialogComponent,
      {
        data: { settings: this.notificationsService.getSettings() },
      },
    );
  }
}
