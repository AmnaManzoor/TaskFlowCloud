import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { AuthStore } from '@core/stores/auth.store';
import { OrganizationService } from '@features/organizations/services/organization.service';
import { hasSystemRole } from '@features/organizations/utils/permissions.util';
import type {
  CreateOrganizationRequest,
  Organization,
  OrganizationListQuery,
  OrganizationMember,
  UpdateOrganizationRequest,
} from '@features/organizations/models/organization.models';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';

@Injectable({ providedIn: 'root' })
export class OrganizationStore {
  private readonly organizationService = inject(OrganizationService);
  private readonly authStore = inject(AuthStore);

  private readonly _items = signal<Organization[]>([]);
  private readonly _selected = signal<Organization | null>(null);
  private readonly _members = signal<OrganizationMember[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _search = signal('');
  private readonly _sortBy = signal('name');
  private readonly _sortDescending = signal(false);
  private readonly _activeFilter = signal<boolean | null>(null);
  private readonly _creatableOrganizations = signal<Organization[]>([]);
  private readonly _loadingCreatable = signal(false);

  readonly items = this._items.asReadonly();
  readonly creatableOrganizations = this._creatableOrganizations.asReadonly();
  readonly loadingCreatable = this._loadingCreatable.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly search = this._search.asReadonly();

  readonly currentMemberRole = computed(() => {
    const userId = this.authStore.user()?.id;
    if (!userId) return undefined;
    return this._members().find((member) => member.userId === userId)?.role;
  });

  loadList(): void {
    this._loading.set(true);
    this._error.set(null);

    const query: OrganizationListQuery = {
      page: this._page(),
      pageSize: this._pageSize(),
      search: this._search() || undefined,
      sortBy: this._sortBy(),
      sortDescending: this._sortDescending(),
      isActive: this._activeFilter(),
    };

    this.organizationService
      .list(query)
      .pipe(
        tap((result) => {
          this._items.set(result.items);
          this._totalCount.set(result.totalCount);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load organizations'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.organizationService
      .getById(id)
      .pipe(
        tap((organization) => this._selected.set(organization)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load organization'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadMembers(organizationId: string): void {
    this.organizationService
      .listMembers(organizationId)
      .pipe(
        tap((members) => this._members.set(members)),
        catchError(() => {
          this._members.set([]);
          return of([]);
        }),
      )
      .subscribe();
  }

  loadCreatableOrganizations(): void {
    this._loadingCreatable.set(true);
    this._error.set(null);

    const query: OrganizationListQuery = {
      page: 1,
      pageSize: 100,
      sortBy: 'name',
      sortDescending: false,
      isActive: true,
    };

    this.organizationService
      .list(query)
      .pipe(
        switchMap((result) => {
          const userId = this.authStore.user()?.id;
          if (!userId || result.items.length === 0) {
            return of([] as Organization[]);
          }

          if (hasSystemRole(this.authStore.roles(), 'SuperAdmin', 'Admin')) {
            return of(result.items);
          }

          return forkJoin(
            result.items.map((organization) =>
              this.organizationService.listMembers(organization.id).pipe(
                map((members) => {
                  const member = members.find((entry) => entry.userId === userId);
                  if (
                    member?.role === OrganizationMemberRole.Owner ||
                    member?.role === OrganizationMemberRole.Administrator
                  ) {
                    return organization;
                  }
                  return null;
                }),
                catchError(() => of(null)),
              ),
            ),
          ).pipe(map((organizations) => organizations.filter((org): org is Organization => org !== null)));
        }),
        tap((organizations) => this._creatableOrganizations.set(organizations)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load organizations'));
          this._creatableOrganizations.set([]);
          return of([] as Organization[]);
        }),
        finalize(() => this._loadingCreatable.set(false)),
      )
      .subscribe();
  }

  create(request: CreateOrganizationRequest, onSuccess?: (org: Organization) => void): void {
    this._saving.set(true);
    this.organizationService
      .create(request)
      .pipe(
        tap((organization) => onSuccess?.(organization)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to create organization'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  update(id: string, request: UpdateOrganizationRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.organizationService
      .update(id, request)
      .pipe(
        tap((organization) => {
          this._selected.set(organization);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update organization'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  delete(id: string, onSuccess?: () => void): void {
    this.organizationService
      .remove(id)
      .pipe(
        tap(() => onSuccess?.()),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete organization'));
          return of(null);
        }),
      )
      .subscribe();
  }

  addMember(organizationId: string, userId: string, role: OrganizationMemberRole): void {
    this.organizationService
      .addMember(organizationId, { userId, role })
      .pipe(tap(() => this.loadMembers(organizationId)))
      .subscribe();
  }

  updateMemberRole(organizationId: string, userId: string, role: OrganizationMemberRole): void {
    this.organizationService
      .updateMemberRole(organizationId, userId, { role })
      .pipe(tap(() => this.loadMembers(organizationId)))
      .subscribe();
  }

  removeMember(organizationId: string, userId: string): void {
    this.organizationService
      .removeMember(organizationId, userId)
      .pipe(tap(() => this.loadMembers(organizationId)))
      .subscribe();
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

  setSort(sortBy: string, sortDescending: boolean): void {
    this._sortBy.set(sortBy);
    this._sortDescending.set(sortDescending);
    this.loadList();
  }

  setActiveFilter(isActive: boolean | null): void {
    this._activeFilter.set(isActive);
    this._page.set(1);
    this.loadList();
  }

  clearError(): void {
    this._error.set(null);
  }
}
