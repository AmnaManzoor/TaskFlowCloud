import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NotificationPriority } from '@features/notifications/models/notification.enums';
import type { NotificationItem } from '@features/notifications/models/notification.models';
import {
  formatRelativeTime,
  getNotificationIcon,
  getNotificationPriority,
  getNotificationRoute,
  getNotificationTypeLabel,
} from '@features/notifications/models/notification.utils';

@Component({
  selector: 'app-notification-card',
  imports: [MatButtonModule, MatChipsModule, MatIconModule, RouterLink],
  template: `
    <article
      class="notification-card"
      [class.notification-card--unread]="!notification().isRead"
      [class.notification-card--selected]="selected()"
      role="article"
      [attr.aria-label]="notification().title"
      tabindex="0"
      (click)="selectedChange.emit(notification())"
      (keydown.enter)="selectedChange.emit(notification())"
    >
      <div
        class="notification-card__icon"
        [class.notification-card__icon--high]="priority() === priorityEnum.High"
        aria-hidden="true"
      >
        <mat-icon>{{ icon() }}</mat-icon>
      </div>

      <div class="notification-card__body">
        <div class="notification-card__header">
          <h3 class="notification-card__title">{{ notification().title }}</h3>
          @if (!notification().isRead) {
            <span class="notification-card__dot" aria-label="Unread"></span>
          }
        </div>

        <p class="notification-card__message">{{ notification().message }}</p>

        <div class="notification-card__meta">
          <mat-chip-set aria-label="Notification metadata">
            <mat-chip>{{ typeLabel() }}</mat-chip>
            @if (notification().referenceType) {
              <mat-chip>{{ notification().referenceType }}</mat-chip>
            }
          </mat-chip-set>
          <time class="notification-card__time" [dateTime]="notification().createdAt">
            {{ formatRelativeTime(notification().createdAt) }}
          </time>
        </div>
      </div>

      <div class="notification-card__actions" (click)="$event.stopPropagation()">
        @if (entityRoute(); as route) {
          <a mat-icon-button [routerLink]="route" aria-label="Open related item">
            <mat-icon>open_in_new</mat-icon>
          </a>
        }
        @if (!notification().isRead) {
          <button
            mat-icon-button
            type="button"
            aria-label="Mark as read"
            (click)="markRead.emit(notification().id)"
          >
            <mat-icon>done</mat-icon>
          </button>
        } @else {
          <button
            mat-icon-button
            type="button"
            aria-label="Mark as unread"
            (click)="markUnread.emit(notification().id)"
          >
            <mat-icon>mark_email_unread</mat-icon>
          </button>
        }
        <button
          mat-icon-button
          type="button"
          aria-label="Delete notification"
          (click)="delete.emit(notification().id)"
        >
          <mat-icon>delete_outline</mat-icon>
        </button>
      </div>
    </article>
  `,
  styles: `
    .notification-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.875rem;
      padding: 0.875rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.875rem;
      background: var(--mat-sys-surface-container-lowest);
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
    }

    .notification-card:hover,
    .notification-card:focus-visible {
      background: var(--mat-sys-surface-container);
      outline: none;
      transform: translateY(-1px);
    }

    .notification-card--unread {
      border-left: 3px solid var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary-container) 35%, var(--mat-sys-surface));
    }

    .notification-card--selected {
      border-color: var(--mat-sys-primary);
      box-shadow: 0 0 0 1px var(--mat-sys-primary);
    }

    .notification-card__icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .notification-card__icon--high {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .notification-card__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .notification-card__title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .notification-card__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 999px;
      background: var(--mat-sys-primary);
    }

    .notification-card__message {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .notification-card__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.625rem;
    }

    .notification-card__time {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .notification-card__actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    @media (max-width: 720px) {
      .notification-card {
        grid-template-columns: auto 1fr;
      }

      .notification-card__actions {
        grid-column: 1 / -1;
        flex-direction: row;
        justify-content: flex-end;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCardComponent {
  readonly notification = input.required<NotificationItem>();
  readonly selected = input(false);

  readonly selectedChange = output<NotificationItem>();
  readonly markRead = output<string>();
  readonly markUnread = output<string>();
  readonly delete = output<string>();

  readonly priorityEnum = NotificationPriority;
  readonly formatRelativeTime = formatRelativeTime;

  protected icon(): string {
    return getNotificationIcon(this.notification().type);
  }

  protected typeLabel(): string {
    return getNotificationTypeLabel(this.notification().type);
  }

  protected priority(): NotificationPriority {
    return getNotificationPriority(this.notification().type);
  }

  protected entityRoute(): string | null {
    return getNotificationRoute(this.notification());
  }
}
