import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { NotificationService as ToastService } from '@core/services/notification.service';
import {
  NotificationCategoryFilter,
  NotificationReadFilter,
  NotificationSortField,
} from '@features/notifications/models/notification.enums';
import {
  DRAWER_NOTIFICATION_LIMIT,
  NOTIFICATION_PAGE_SIZE,
  type NotificationFilters,
  type NotificationItem,
} from '@features/notifications/models/notification.models';
import {
  buildNotificationApiQuery,
  groupNotificationsByDate,
  matchesCategoryFilter,
  matchesKeyword,
} from '@features/notifications/models/notification.utils';
import { NotificationApiService } from '@features/notifications/services/notification-api.service';

const DEFAULT_FILTERS: NotificationFilters = {
  read: NotificationReadFilter.All,
  category: NotificationCategoryFilter.All,
  type: null,
  createdFrom: null,
  createdTo: null,
  keyword: '',
  projectId: null,
  organizationId: null,
  sortBy: NotificationSortField.CreatedAt,
  sortDescending: true,
};

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApiService);
  private readonly toast = inject(ToastService);

  private readonly _items = signal<NotificationItem[]>([]);
  private readonly _drawerItems = signal<NotificationItem[]>([]);
  private readonly _selected = signal<NotificationItem | null>(null);
  private readonly _unreadCount = signal(0);
  private readonly _filters = signal<NotificationFilters>({ ...DEFAULT_FILTERS });
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _drawerLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(NOTIFICATION_PAGE_SIZE);
  private readonly _totalCount = signal(0);

  readonly items = this._items.asReadonly();
  readonly drawerItems = this._drawerItems.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly drawerLoading = this._drawerLoading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly hasMore = computed(() => this._items().length < this._totalCount());

  readonly filteredItems = computed(() => {
    const filters = this._filters();
    return this._items().filter(
      (item) =>
        matchesCategoryFilter(item, filters.category) &&
        matchesKeyword(item, filters.keyword) &&
        this.matchesReferenceFilter(item, filters),
    );
  });

  readonly groupedItems = computed(() => groupNotificationsByDate(this.filteredItems()));

  readonly unreadItems = computed(() => this._items().filter((item) => !item.isRead));
  readonly readItems = computed(() => this._items().filter((item) => item.isRead));

  load(append = false): void {
    if (append) {
      this._loadingMore.set(true);
    } else {
      this._loading.set(true);
    }
    this._error.set(null);

    const filters = this._filters();
    const query = {
      page: this._page(),
      pageSize: this._pageSize(),
      ...buildNotificationApiQuery(filters),
    };

    this.api
      .list(query)
      .pipe(
        tap((result) => {
          this._totalCount.set(result.totalCount);
          this._items.update((current) => (append ? [...current, ...result.items] : result.items));
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load notifications'));
          return of(null);
        }),
        finalize(() => {
          this._loading.set(false);
          this._loadingMore.set(false);
        }),
      )
      .subscribe();
  }

  loadInitial(): void {
    this._page.set(1);
    this._items.set([]);
    this.load();
  }

  loadMore(): void {
    if (!this.hasMore() || this._loadingMore() || this._loading()) {
      return;
    }
    this._page.update((page) => page + 1);
    this.load(true);
  }

  loadDrawerPreview(): void {
    this._drawerLoading.set(true);
    this.api
      .list({
        page: 1,
        pageSize: DRAWER_NOTIFICATION_LIMIT,
        sortBy: NotificationSortField.CreatedAt,
        sortDescending: true,
      })
      .pipe(
        tap((result) => this._drawerItems.set(result.items)),
        catchError(() => of(null)),
        finalize(() => this._drawerLoading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .getById(id)
      .pipe(
        tap((item) => {
          this._selected.set(item);
          this._items.update((items) => {
            const exists = items.some((entry) => entry.id === item.id);
            return exists ? items.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...items];
          });
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load notification'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  select(item: NotificationItem | null): void {
    this._selected.set(item);
  }

  setFilters(partial: Partial<NotificationFilters>): void {
    this._filters.update((current) => ({ ...current, ...partial }));
    this.loadInitial();
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
    this.loadInitial();
  }

  setUnreadCount(count: number): void {
    this._unreadCount.set(Math.max(0, count));
  }

  refreshUnreadCount(): void {
    this.api
      .getCount()
      .pipe(
        tap((response) => this._unreadCount.set(response.unreadCount)),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  markRead(id: string): void {
    this._saving.set(true);
    this.api
      .markRead(id)
      .pipe(
        tap((updated) => {
          this.applyUpdatedNotification(updated);
          if (updated.isRead) {
            this._unreadCount.update((count) => Math.max(0, count - 1));
          }
        }),
        catchError((error) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to mark notification as read'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  markUnread(id: string): void {
    this._saving.set(true);
    this.api
      .markUnread(id)
      .pipe(
        tap((updated) => {
          this.applyUpdatedNotification(updated);
          if (!updated.isRead) {
            this._unreadCount.update((count) => count + 1);
          }
        }),
        catchError((error) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to mark notification as unread'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  markAllRead(): void {
    this._saving.set(true);
    this.api
      .markAllRead()
      .pipe(
        tap(() => {
          const now = new Date().toISOString();
          this._items.update((items) =>
            items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? now })),
          );
          this._drawerItems.update((items) =>
            items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? now })),
          );
          this._unreadCount.set(0);
          this.toast.success('All notifications marked as read');
        }),
        catchError((error) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to mark all as read'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  delete(id: string): void {
    this._saving.set(true);
    this.api
      .remove(id)
      .pipe(
        tap(() => {
          const removed = this._items().find((item) => item.id === id);
          this._items.update((items) => items.filter((item) => item.id !== id));
          this._drawerItems.update((items) => items.filter((item) => item.id !== id));
          if (removed && !removed.isRead) {
            this._unreadCount.update((count) => Math.max(0, count - 1));
          }
          if (this._selected()?.id === id) {
            this._selected.set(null);
          }
          this.toast.success('Notification deleted');
        }),
        catchError((error) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to delete notification'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  deleteAllRead(): void {
    this._saving.set(true);
    this.api
      .deleteAllRead()
      .pipe(
        tap(() => {
          this._items.update((items) => items.filter((item) => !item.isRead));
          this._drawerItems.update((items) => items.filter((item) => !item.isRead));
          this.toast.success('Read notifications deleted');
        }),
        catchError((error) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to delete read notifications'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  clear(): void {
    this._items.set([]);
    this._drawerItems.set([]);
    this._selected.set(null);
    this._error.set(null);
    this._page.set(1);
    this._totalCount.set(0);
    this._filters.set({ ...DEFAULT_FILTERS });
  }

  private applyUpdatedNotification(updated: NotificationItem): void {
    const updater = (items: NotificationItem[]) =>
      items.map((item) => (item.id === updated.id ? updated : item));

    this._items.update(updater);
    this._drawerItems.update(updater);
    if (this._selected()?.id === updated.id) {
      this._selected.set(updated);
    }
  }

  private matchesReferenceFilter(item: NotificationItem, filters: NotificationFilters): boolean {
    if (filters.projectId && item.referenceType === 'Project' && item.referenceId !== filters.projectId) {
      return false;
    }
    if (
      filters.organizationId &&
      item.referenceType === 'Organization' &&
      item.referenceId !== filters.organizationId
    ) {
      return false;
    }
    return true;
  }
}
