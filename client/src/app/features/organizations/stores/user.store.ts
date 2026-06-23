import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { UserManagementService } from '@features/organizations/services/user-management.service';
import type {
  UpdateUserProfileRequest,
  UserDetail,
  UserListQuery,
  UserSummary,
} from '@features/organizations/models/user.models';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userService = inject(UserManagementService);

  private readonly _items = signal<UserSummary[]>([]);
  private readonly _selected = signal<UserDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _search = signal('');
  private readonly _activeFilter = signal<boolean | null>(null);
  private readonly _sortBy = signal('email');
  private readonly _sortDescending = signal(false);

  readonly items = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly search = this._search.asReadonly();

  loadList(): void {
    this._loading.set(true);
    this._error.set(null);

    const query: UserListQuery = {
      page: this._page(),
      pageSize: this._pageSize(),
      search: this._search() || undefined,
      sortBy: this._sortBy(),
      sortDescending: this._sortDescending(),
      isActive: this._activeFilter(),
    };

    this.userService
      .list(query)
      .pipe(
        tap((result) => {
          this._items.set(result.items);
          this._totalCount.set(result.totalCount);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load users'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.userService
      .getById(id)
      .pipe(
        tap((user) => this._selected.set(user)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load user'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  updateProfile(id: string, request: UpdateUserProfileRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.userService
      .updateProfile(id, request)
      .pipe(
        tap((user) => {
          this._selected.set(user);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update profile'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  activate(id: string): void {
    this.runAction(() => this.userService.activate(id));
  }

  deactivate(id: string): void {
    this.runAction(() => this.userService.deactivate(id));
  }

  lock(id: string): void {
    this.runAction(() => this.userService.lock(id));
  }

  unlock(id: string): void {
    this.runAction(() => this.userService.unlock(id));
  }

  setPage(page: number): void {
    this._page.set(page);
    this.loadList();
  }

  setSearch(search: string): void {
    this._search.set(search);
    this._page.set(1);
    this.loadList();
  }

  setActiveFilter(isActive: boolean | null): void {
    this._activeFilter.set(isActive);
    this._page.set(1);
    this.loadList();
  }

  setSort(sortBy: string, sortDescending: boolean): void {
    this._sortBy.set(sortBy);
    this._sortDescending.set(sortDescending);
    this.loadList();
  }

  clearError(): void {
    this._error.set(null);
  }

  private runAction(action: () => ReturnType<UserManagementService['activate']>): void {
    action()
      .pipe(
        tap(() => {
          const selected = this._selected();
          if (selected) {
            this.loadById(selected.id);
          }
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Action failed'));
          return of(null);
        }),
      )
      .subscribe();
  }
}
