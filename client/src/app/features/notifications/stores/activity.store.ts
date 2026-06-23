import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { NotificationService as ToastService } from '@core/services/notification.service';
import {
  ActivityEntityFilter,
  ActivityScope,
} from '@features/notifications/models/notification.enums';
import type {
  ActivityFilters,
  ActivityHistoryItem,
  ActivityListQuery,
} from '@features/notifications/models/activity.models';
import { groupActivityByDate } from '@features/notifications/models/notification.utils';
import { ActivityApiService } from '@features/notifications/services/activity-api.service';

const DEFAULT_FILTERS: ActivityFilters = {
  scope: ActivityScope.All,
  entityType: ActivityEntityFilter.All,
  activityType: null,
  createdFrom: null,
  createdTo: null,
  keyword: '',
  projectId: null,
  userId: null,
  sortDescending: true,
};

const ACTIVITY_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly api = inject(ActivityApiService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  private readonly _items = signal<ActivityHistoryItem[]>([]);
  private readonly _filters = signal<ActivityFilters>({ ...DEFAULT_FILTERS });
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _totalCount = signal(0);

  readonly items = this._items.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasMore = computed(() => this._items().length < this._totalCount());

  readonly filteredItems = computed(() => {
    const keyword = this._filters().keyword.trim().toLowerCase();
    if (!keyword) {
      return this._items();
    }

    return this._items().filter(
      (item) =>
        item.description.toLowerCase().includes(keyword) ||
        item.activityType.toLowerCase().includes(keyword) ||
        item.entityType.toLowerCase().includes(keyword),
    );
  });

  readonly groupedItems = computed(() => groupActivityByDate(this.filteredItems()));

  load(append = false): void {
    if (append) {
      this._loadingMore.set(true);
    } else {
      this._loading.set(true);
    }
    this._error.set(null);

    const query = this.buildQuery();

    this.resolveRequest(query)
      .pipe(
        tap((result) => {
          if (!result) return;
          this._totalCount.set(result.totalCount);
          this._items.update((current) => (append ? [...current, ...result.items] : result.items));
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load activity'));
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

  setFilters(partial: Partial<ActivityFilters>): void {
    this._filters.update((current) => ({ ...current, ...partial }));
    this.loadInitial();
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
    this.loadInitial();
  }

  refresh(): void {
    this.loadInitial();
  }

  clear(): void {
    this._items.set([]);
    this._error.set(null);
    this._page.set(1);
    this._totalCount.set(0);
    this._filters.set({ ...DEFAULT_FILTERS });
  }

  private buildQuery(): ActivityListQuery {
    const filters = this._filters();
    const query: ActivityListQuery = {
      page: this._page(),
      pageSize: ACTIVITY_PAGE_SIZE,
      sortBy: 'createdAt',
      sortDescending: filters.sortDescending,
    };

    if (filters.activityType) {
      query.activityType = filters.activityType;
    }
    if (filters.entityType !== ActivityEntityFilter.All) {
      query.entityType = filters.entityType;
    }
    if (filters.createdFrom) {
      query.createdFrom = filters.createdFrom;
    }
    if (filters.createdTo) {
      query.createdTo = filters.createdTo;
    }

    return query;
  }

  private resolveRequest(query: ActivityListQuery) {
    const filters = this._filters();
    const currentUserId = this.authStore.user()?.id;

    if (filters.scope === ActivityScope.Project && filters.projectId) {
      return this.api.listByProject(filters.projectId, query);
    }

    if (filters.scope === ActivityScope.Personal) {
      const userId = filters.userId ?? currentUserId;
      if (userId) {
        return this.api.listByUser(userId, query);
      }
    }

    if (filters.scope === ActivityScope.Organization && filters.entityType === ActivityEntityFilter.Organization) {
      return this.api.list({
        ...query,
        entityType: 'Organization',
      });
    }

    return this.api.list(query);
  }
}
