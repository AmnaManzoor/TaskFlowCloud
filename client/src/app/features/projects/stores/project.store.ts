import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { AuthStore } from '@core/stores/auth.store';
import { ProjectApiService } from '@features/projects/services/project-api.service';
import { ProjectService } from '@features/projects/services/project.service';
import { currentMemberRole } from '@features/projects/utils/project-permissions.util';
import type {
  CreateProjectRequest,
  Project,
  ProjectFilters,
  ProjectMember,
  UpdateProjectRequest,
} from '@features/projects/models/project.models';
import { ProjectPriority, ProjectRole, ProjectStatus } from '@features/projects/models/project.enums';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly projectService = inject(ProjectService);
  private readonly projectApi = inject(ProjectApiService);
  private readonly authStore = inject(AuthStore);

  private readonly _items = signal<Project[]>([]);
  private readonly _selected = signal<Project | null>(null);
  private readonly _members = signal<ProjectMember[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _search = signal('');
  private readonly _sortBy = signal('name');
  private readonly _sortDescending = signal(false);
  private readonly _filters = signal<ProjectFilters>({
    organizationId: null,
    status: null,
    priority: null,
    isArchived: null,
    ownerId: null,
  });
  private readonly _selectedOrganizationId = signal<string | null>(null);

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
  readonly filters = this._filters.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortDescending = this._sortDescending.asReadonly();
  readonly selectedOrganizationId = this._selectedOrganizationId.asReadonly();

  readonly currentUserRole = computed(() =>
    currentMemberRole(this._members(), this.authStore.user()?.id),
  );

  loadList(): void {
    this._loading.set(true);
    this._error.set(null);

    const filters = {
      ...this._filters(),
      organizationId: this._selectedOrganizationId() ?? this._filters().organizationId,
    };

    this.projectService
      .loadProjects(
        this._page(),
        this._pageSize(),
        this._search(),
        filters,
        this._sortBy(),
        this._sortDescending(),
      )
      .pipe(
        tap((result) => {
          this._items.set(result.items);
          this._totalCount.set(result.totalCount);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load projects'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.projectService
      .getProject(id)
      .pipe(
        tap((project) => this._selected.set(project)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load project'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadMembers(projectId: string): void {
    this.projectApi
      .listMembers(projectId)
      .pipe(
        tap((members) => this._members.set(members)),
        catchError(() => {
          this._members.set([]);
          return of([]);
        }),
      )
      .subscribe();
  }

  create(request: CreateProjectRequest, onSuccess?: (project: Project) => void): void {
    this._saving.set(true);
    this.projectApi
      .create(request)
      .pipe(
        tap((project) => onSuccess?.(project)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to create project'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  update(id: string, request: UpdateProjectRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.projectApi
      .update(id, request)
      .pipe(
        tap((project) => {
          this._selected.set(project);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update project'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  archive(id: string, onSuccess?: () => void): void {
    this.projectApi
      .archive(id)
      .pipe(
        tap((project) => {
          this._selected.set(project);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to archive project'));
          return of(null);
        }),
      )
      .subscribe();
  }

  restore(id: string, onSuccess?: () => void): void {
    this.projectApi
      .restore(id)
      .pipe(
        tap((project) => {
          this._selected.set(project);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to restore project'));
          return of(null);
        }),
      )
      .subscribe();
  }

  delete(id: string, onSuccess?: () => void): void {
    this.projectApi
      .remove(id)
      .pipe(
        tap(() => onSuccess?.()),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete project'));
          return of(null);
        }),
      )
      .subscribe();
  }

  changeStatus(id: string, status: ProjectStatus): void {
    this.projectApi
      .changeStatus(id, { status })
      .pipe(tap((project) => this._selected.set(project)))
      .subscribe();
  }

  changePriority(id: string, priority: ProjectPriority): void {
    this.projectApi
      .changePriority(id, { priority })
      .pipe(tap((project) => this._selected.set(project)))
      .subscribe();
  }

  addMember(projectId: string, userId: string, role: ProjectRole): void {
    this.projectApi
      .addMember(projectId, { userId, role })
      .pipe(tap(() => this.loadMembers(projectId)))
      .subscribe();
  }

  updateMemberRole(projectId: string, userId: string, role: ProjectRole): void {
    this.projectApi
      .updateMemberRole(projectId, userId, { role })
      .pipe(tap(() => this.loadMembers(projectId)))
      .subscribe();
  }

  removeMember(projectId: string, userId: string): void {
    this.projectApi
      .removeMember(projectId, userId)
      .pipe(tap(() => this.loadMembers(projectId)))
      .subscribe();
  }

  transferOwner(projectId: string, newOwnerId: string, onSuccess?: () => void): void {
    this.projectApi
      .transferOwner(projectId, { newOwnerId })
      .pipe(
        tap((project) => {
          this._selected.set(project);
          this.loadMembers(projectId);
          onSuccess?.();
        }),
      )
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

  setFilters(filters: Partial<ProjectFilters>): void {
    this._filters.update((current) => ({ ...current, ...filters }));
    this._page.set(1);
    this.loadList();
  }

  setOrganizationFilter(organizationId: string | null): void {
    this._selectedOrganizationId.set(organizationId);
    this._page.set(1);
    this.loadList();
  }

  clearError(): void {
    this._error.set(null);
  }
}
