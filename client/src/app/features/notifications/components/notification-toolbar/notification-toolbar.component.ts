import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationSortField } from '@features/notifications/models/notification.enums';
import { NotificationStore } from '@features/notifications/stores/notification.store';

@Component({
  selector: 'app-notification-toolbar',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatSlideToggleModule],
  template: `
    <div class="notification-toolbar" role="toolbar" aria-label="Notification actions">
      <div class="notification-toolbar__left">
        <h2 class="notification-toolbar__title">{{ title() }}</h2>
        @if (unreadCount() > 0) {
          <span class="notification-toolbar__count">{{ unreadCount() }} unread</span>
        }
      </div>

      <div class="notification-toolbar__actions">
        <button mat-icon-button type="button" aria-label="Refresh" (click)="refresh.emit()">
          <mat-icon>refresh</mat-icon>
        </button>

        <button
          mat-stroked-button
          type="button"
          [disabled]="unreadCount() === 0 || saving()"
          (click)="markAllRead.emit()"
        >
          Mark all read
        </button>

        <button
          mat-stroked-button
          type="button"
          color="warn"
          [disabled]="saving()"
          (click)="deleteRead.emit()"
        >
          Delete read
        </button>

        <button mat-stroked-button type="button" [matMenuTriggerFor]="sortMenu">
          <mat-icon>sort</mat-icon>
          Sort
        </button>
        <mat-menu #sortMenu="matMenu">
          <button mat-menu-item type="button" (click)="setSort(sortFields.CreatedAt, true)">
            Newest first
          </button>
          <button mat-menu-item type="button" (click)="setSort(sortFields.CreatedAt, false)">
            Oldest first
          </button>
          <button mat-menu-item type="button" (click)="setSort(sortFields.Type, true)">Type</button>
        </mat-menu>

        <button mat-stroked-button type="button" (click)="toggleFilters.emit()">
          <mat-icon>filter_list</mat-icon>
          Filters
        </button>

        @if (showSettings()) {
          <button mat-icon-button type="button" aria-label="Notification settings" (click)="openSettings.emit()">
            <mat-icon>settings</mat-icon>
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .notification-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .notification-toolbar__left {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }

    .notification-toolbar__title {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .notification-toolbar__count {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
    }

    .notification-toolbar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToolbarComponent {
  private readonly store = inject(NotificationStore);

  readonly title = input('Notifications');
  readonly unreadCount = input(0);
  readonly saving = input(false);
  readonly showSettings = input(true);

  readonly refresh = output<void>();
  readonly markAllRead = output<void>();
  readonly deleteRead = output<void>();
  readonly toggleFilters = output<void>();
  readonly openSettings = output<void>();

  readonly sortFields = NotificationSortField;

  protected setSort(sortBy: NotificationSortField, sortDescending: boolean): void {
    this.store.setFilters({ sortBy, sortDescending });
  }
}
