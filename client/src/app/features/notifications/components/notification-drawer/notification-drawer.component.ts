import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NotificationCardComponent } from '@features/notifications/components/notification-card/notification-card.component';
import { NotificationEmptyComponent } from '@features/notifications/components/notification-empty/notification-empty.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { NotificationStore } from '@features/notifications/stores/notification.store';
import type { NotificationItem } from '@features/notifications/models/notification.models';

@Component({
  selector: 'app-notification-drawer',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    RouterLink,
    NotificationCardComponent,
    NotificationEmptyComponent,
    SkeletonLoaderComponent,
  ],
  template: `
    @if (opened()) {
      <button
        type="button"
        class="notification-drawer__backdrop"
        aria-label="Close notifications"
        (click)="close()"
      ></button>

      <aside class="notification-drawer" role="dialog" aria-label="Notifications drawer">
        <header class="notification-drawer__header">
          <div>
            <h2 class="notification-drawer__title">Notifications</h2>
            @if (store.unreadCount() > 0) {
              <p class="notification-drawer__subtitle">{{ store.unreadCount() }} unread</p>
            }
          </div>
          <button mat-icon-button type="button" aria-label="Close notifications" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <div class="notification-drawer__actions">
          <button
            mat-button
            type="button"
            [disabled]="store.unreadCount() === 0"
            (click)="store.markAllRead()"
          >
            Mark all read
          </button>
          <a mat-button routerLink="/notifications" (click)="close()">Open center</a>
        </div>

        <mat-divider />

        <div class="notification-drawer__content">
          @if (store.drawerLoading()) {
            <app-skeleton-loader [rows]="4" />
          } @else if (store.drawerItems().length === 0) {
            <app-notification-empty />
          } @else {
            @for (notification of store.drawerItems(); track notification.id) {
              <app-notification-card
                [notification]="notification"
                (selectedChange)="onSelect($event)"
                (markRead)="store.markRead($event)"
                (markUnread)="store.markUnread($event)"
                (delete)="store.delete($event)"
              />
            }
          }
        </div>
      </aside>
    }
  `,
  styles: `
    .notification-drawer__backdrop {
      position: fixed;
      inset: 0;
      z-index: 1090;
      border: 0;
      background: color-mix(in srgb, var(--mat-sys-scrim) 35%, transparent);
      cursor: pointer;
    }

    .notification-drawer {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 1100;
      display: flex;
      flex-direction: column;
      width: min(28rem, 100vw);
      height: 100vh;
      padding: 1rem;
      background: var(--mat-sys-surface);
      box-shadow: -4px 0 24px color-mix(in srgb, var(--mat-sys-shadow) 20%, transparent);
      animation: drawer-slide-in 180ms ease;
    }

    .notification-drawer__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .notification-drawer__title {
      margin: 0;
      font: var(--mat-sys-title-large);
    }

    .notification-drawer__subtitle {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
    }

    .notification-drawer__actions {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .notification-drawer__content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
      overflow: auto;
      flex: 1 1 auto;
    }

    @keyframes drawer-slide-in {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDrawerComponent {
  readonly store = inject(NotificationStore);

  readonly opened = input(false);

  readonly openedChange = output<boolean>();
  readonly notificationSelected = output<NotificationItem>();

  protected close(): void {
    this.openedChange.emit(false);
  }

  protected onSelect(notification: NotificationItem): void {
    this.notificationSelected.emit(notification);
    if (!notification.isRead) {
      this.store.markRead(notification.id);
    }
    this.close();
  }
}
