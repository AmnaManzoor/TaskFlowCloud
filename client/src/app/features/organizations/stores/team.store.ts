import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { TeamService } from '@features/organizations/services/team.service';
import type {
  CreateTeamRequest,
  Team,
  TeamListQuery,
  TeamMember,
  UpdateTeamRequest,
} from '@features/organizations/models/team.models';

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly teamService = inject(TeamService);

  private readonly _items = signal<Team[]>([]);
  private readonly _selected = signal<Team | null>(null);
  private readonly _members = signal<TeamMember[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _search = signal('');
  private readonly _organizationId = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly search = this._search.asReadonly();

  loadList(organizationId?: string): void {
    if (organizationId) {
      this._organizationId.set(organizationId);
    }

    this._loading.set(true);
    this._error.set(null);

    const query: TeamListQuery = {
      organizationId: this._organizationId() ?? undefined,
      page: this._page(),
      pageSize: this._pageSize(),
      search: this._search() || undefined,
      sortBy: 'name',
      sortDescending: false,
    };

    this.teamService
      .list(query)
      .pipe(
        tap((result) => {
          this._items.set(result.items);
          this._totalCount.set(result.totalCount);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load teams'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._loading.set(true);
    this.teamService
      .getById(id)
      .pipe(
        tap((team) => this._selected.set(team)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load team'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadMembers(teamId: string): void {
    this.teamService
      .listMembers(teamId)
      .pipe(
        tap((members) => this._members.set(members)),
        catchError(() => {
          this._members.set([]);
          return of([]);
        }),
      )
      .subscribe();
  }

  create(request: CreateTeamRequest, onSuccess?: (team: Team) => void): void {
    this._saving.set(true);
    this.teamService
      .create(request)
      .pipe(
        tap((team) => onSuccess?.(team)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to create team'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  update(id: string, request: UpdateTeamRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.teamService
      .update(id, request)
      .pipe(
        tap((team) => {
          this._selected.set(team);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update team'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  delete(id: string, onSuccess?: () => void): void {
    this.teamService
      .remove(id)
      .pipe(
        tap(() => onSuccess?.()),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete team'));
          return of(null);
        }),
      )
      .subscribe();
  }

  addMember(teamId: string, userId: string): void {
    this.teamService
      .addMember(teamId, { userId })
      .pipe(tap(() => this.loadMembers(teamId)))
      .subscribe();
  }

  removeMember(teamId: string, userId: string): void {
    this.teamService
      .removeMember(teamId, userId)
      .pipe(tap(() => this.loadMembers(teamId)))
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

  clearError(): void {
    this._error.set(null);
  }
}
