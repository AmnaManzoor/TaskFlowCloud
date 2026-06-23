import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificationCardComponent } from '@features/notifications/components/notification-card/notification-card.component';
import { DateSeparatorComponent } from '@features/notifications/components/date-separator/date-separator.component';
import { NotificationEmptyComponent } from '@features/notifications/components/notification-empty/notification-empty.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import type { NotificationItem } from '@features/notifications/models/notification.models';
import { NotificationStore } from '@features/notifications/stores/notification.store';

@Component({
  selector: 'app-notification-list',
  imports: [
    NotificationCardComponent,
    DateSeparatorComponent,
    NotificationEmptyComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    MatProgressBarModule,
  ],
  template: `
    <section class="notification-list" aria-label="Notifications">
      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="retry.emit()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="6" />
      } @else if (store.groupedItems().length === 0) {
        <app-notification-empty />
      } @else {
        <div class="notification-list__scroll" (scroll)="onScroll($event)">
          @for (group of store.groupedItems(); track group.dateKey) {
            <app-date-separator [label]="group.label" />
            @for (notification of group.items; track notification.id) {
              <app-notification-card
                [notification]="notification"
                [selected]="selectedId() === notification.id"
                (selectedChange)="selectedChange.emit($event)"
                (markRead)="markRead.emit($event)"
                (markUnread)="markUnread.emit($event)"
                (delete)="delete.emit($event)"
              />
            }
          }

          @if (store.loadingMore()) {
            <mat-progress-bar mode="indeterminate" aria-label="Loading more notifications" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .notification-list {
      display: flex;
      flex-direction: column;
      min-height: 12rem;
    }

    .notification-list__scroll {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: calc(100vh - 16rem);
      overflow: auto;
      padding-right: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent {
  readonly store = inject(NotificationStore);

  readonly selectedId = input<string | null>(null);
  readonly infiniteScroll = input(true);

  readonly selectedChange = output<NotificationItem>();
  readonly markRead = output<string>();
  readonly markUnread = output<string>();
  readonly delete = output<string>();
  readonly retry = output<void>();

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    if (!this.infiniteScroll()) return;

    const element = event.target as HTMLElement;
    const threshold = 120;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.store.loadMore();
    }
  }
}
