import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { NotificationService } from '@core/services/notification.service';
import { TaskApiService } from '@features/tasks/services/task-api.service';
import { TaskService } from '@features/tasks/services/task.service';
import type {
  ActivityHistoryItem,
  AddTaskLabelRequest,
  CreateChecklistRequest,
  CreateTaskRequest,
  Task,
  TaskFilters,
  UpdateChecklistRequest,
  UpdateTaskRequest,
} from '@features/tasks/models/task.models';
import { TaskPriority, TaskStatus, TaskViewMode } from '@features/tasks/models/task.enums';
import { groupTasksByStatus } from '@features/tasks/models/task.utils';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskService = inject(TaskService);
  private readonly taskApi = inject(TaskApiService);
  private readonly notification = inject(NotificationService);

  private readonly _items = signal<Task[]>([]);
  private readonly _boardItems = signal<Task[]>([]);
  private readonly _calendarItems = signal<Task[]>([]);
  private readonly _selected = signal<Task | null>(null);
  private readonly _activity = signal<ActivityHistoryItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _boardLoading = signal(false);
  private readonly _calendarLoading = signal(false);
  private readonly _detailLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _search = signal('');
  private readonly _sortBy = signal('createdAt');
  private readonly _sortDescending = signal(true);
  private readonly _viewMode = signal<TaskViewMode>('board');
  private readonly _filters = signal<TaskFilters>({
    projectId: null,
    status: null,
    priority: null,
    type: null,
    assigneeId: null,
    labelId: null,
    dueDateFrom: null,
    dueDateTo: null,
    createdFrom: null,
    createdTo: null,
  });
  private readonly _calendarRange = signal<{ from: string; to: string }>({
    from: '',
    to: '',
  });

  readonly items = this._items.asReadonly();
  readonly boardItems = this._boardItems.asReadonly();
  readonly calendarItems = this._calendarItems.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly activity = this._activity.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly boardLoading = this._boardLoading.asReadonly();
  readonly calendarLoading = this._calendarLoading.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly search = this._search.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortDescending = this._sortDescending.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();
  readonly calendarRange = this._calendarRange.asReadonly();

  readonly boardGroups = computed(() => groupTasksByStatus(this._boardItems()));

  loadList(): void {
    this._loading.set(true);
    this._error.set(null);

    this.taskService
      .loadTasks(
        this._page(),
        this._pageSize(),
        this._search(),
        this._filters(),
        this._sortBy(),
        this._sortDescending(),
      )
      .pipe(
        tap((result) => {
          this._items.set(result.items);
          this._totalCount.set(result.totalCount);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load tasks'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loadBoard(): void {
    this._boardLoading.set(true);
    this._error.set(null);

    this.taskService
      .loadBoardTasks(this._filters().projectId, this._search(), this._filters())
      .pipe(
        tap((result) => this._boardItems.set(result.items)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load board'));
          return of(null);
        }),
        finalize(() => this._boardLoading.set(false)),
      )
      .subscribe();
  }

  loadCalendar(from: string, to: string): void {
    this._calendarRange.set({ from, to });
    this._calendarLoading.set(true);
    this._error.set(null);

    this.taskService
      .loadCalendarTasks(this._filters().projectId, from, to, this._filters())
      .pipe(
        tap((result) => this._calendarItems.set(result.items)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load calendar'));
          return of(null);
        }),
        finalize(() => this._calendarLoading.set(false)),
      )
      .subscribe();
  }

  loadById(id: string): void {
    this._detailLoading.set(true);
    this._error.set(null);

    this.taskService
      .getTask(id)
      .pipe(
        tap((task) => this._selected.set(task)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load task'));
          return of(null);
        }),
        finalize(() => this._detailLoading.set(false)),
      )
      .subscribe();
  }

  loadActivity(taskId: string): void {
    this.taskApi
      .listActivity({
        entityType: 'Task',
        entityId: taskId,
        page: 1,
        pageSize: 50,
        sortDescending: true,
      })
      .pipe(
        tap((result) => this._activity.set(result.items)),
        catchError(() => {
          this._activity.set([]);
          return of(null);
        }),
      )
      .subscribe();
  }

  create(request: CreateTaskRequest, onSuccess?: (task: Task) => void): void {
    this._saving.set(true);
    this.taskApi
      .create(request)
      .pipe(
        tap((task) => {
          this.notification.success('Task created');
          onSuccess?.(task);
          this.refreshCurrentView();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to create task'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  update(id: string, request: UpdateTaskRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.taskApi
      .update(id, request)
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.notification.success('Task updated');
          onSuccess?.();
          this.refreshCurrentView();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update task'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  delete(id: string, onSuccess?: () => void): void {
    this.taskApi
      .remove(id)
      .pipe(
        tap(() => {
          this._selected.set(null);
          this.notification.success('Task deleted');
          onSuccess?.();
          this.refreshCurrentView();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete task'));
          return of(null);
        }),
      )
      .subscribe();
  }

  changeStatus(id: string, status: TaskStatus, onSuccess?: () => void): void {
    this.taskApi
      .changeStatus(id, { status })
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.updateTaskInCollections(task);
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to change status'));
          return of(null);
        }),
      )
      .subscribe();
  }

  changePriority(id: string, priority: TaskPriority): void {
    this.taskApi
      .changePriority(id, { priority })
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.updateTaskInCollections(task);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to change priority'));
          return of(null);
        }),
      )
      .subscribe();
  }

  assignUsers(id: string, userIds: string[]): void {
    this.taskApi
      .assign(id, { userIds })
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.updateTaskInCollections(task);
          this.notification.success('Assignees updated');
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to assign users'));
          return of(null);
        }),
      )
      .subscribe();
  }

  unassignUser(id: string, userId: string): void {
    this.taskApi
      .unassign(id, userId)
      .pipe(
        tap(() => {
          this.loadById(id);
          this.refreshCurrentView();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to remove assignee'));
          return of(null);
        }),
      )
      .subscribe();
  }

  addLabel(id: string, request: AddTaskLabelRequest): void {
    this.taskApi
      .addLabel(id, request)
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.updateTaskInCollections(task);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to add label'));
          return of(null);
        }),
      )
      .subscribe();
  }

  removeLabel(id: string, labelId: string): void {
    this.taskApi
      .removeLabel(id, labelId)
      .pipe(
        tap(() => this.loadById(id)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to remove label'));
          return of(null);
        }),
      )
      .subscribe();
  }

  createChecklist(id: string, request: CreateChecklistRequest): void {
    this.taskApi
      .createChecklist(id, request)
      .pipe(
        tap(() => this.loadById(id)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to create checklist item'));
          return of(null);
        }),
      )
      .subscribe();
  }

  updateChecklist(taskId: string, checklistId: string, request: UpdateChecklistRequest): void {
    this.taskApi
      .updateChecklist(taskId, checklistId, request)
      .pipe(
        tap(() => this.loadById(taskId)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update checklist item'));
          return of(null);
        }),
      )
      .subscribe();
  }

  removeChecklist(taskId: string, checklistId: string): void {
    this.taskApi
      .removeChecklist(taskId, checklistId)
      .pipe(
        tap(() => this.loadById(taskId)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to remove checklist item'));
          return of(null);
        }),
      )
      .subscribe();
  }

  moveTask(id: string, targetProjectId: string, onSuccess?: () => void): void {
    this.taskApi
      .move(id, { targetProjectId })
      .pipe(
        tap((task) => {
          this._selected.set(task);
          this.notification.success('Task moved');
          onSuccess?.();
          this.refreshCurrentView();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to move task'));
          return of(null);
        }),
      )
      .subscribe();
  }

  updateHours(id: string, estimatedHours: number | null, actualHours: number | null): void {
    this.taskApi
      .updateHours(id, { estimatedHours, actualHours })
      .pipe(
        tap((task) => this._selected.set(task)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update hours'));
          return of(null);
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
    this.refreshCurrentView();
  }

  setSort(sortBy: string, sortDescending: boolean): void {
    this._sortBy.set(sortBy);
    this._sortDescending.set(sortDescending);
    this.loadList();
  }

  setFilters(filters: Partial<TaskFilters>): void {
    this._filters.update((current) => ({ ...current, ...filters }));
    this._page.set(1);
    this.refreshCurrentView();
  }

  setProjectFilter(projectId: string | null): void {
    this.setFilters({ projectId });
  }

  setViewMode(mode: TaskViewMode): void {
    this._viewMode.set(mode);
  }

  clearSelected(): void {
    this._selected.set(null);
    this._activity.set([]);
  }

  clearError(): void {
    this._error.set(null);
  }

  refreshCurrentView(): void {
    const mode = this._viewMode();
    if (mode === 'board') {
      this.loadBoard();
    } else if (mode === 'calendar') {
      const range = this._calendarRange();
      if (range.from && range.to) {
        this.loadCalendar(range.from, range.to);
      }
    } else {
      this.loadList();
    }
  }

  private updateTaskInCollections(task: Task): void {
    const updateList = (items: Task[]) =>
      items.map((item) => (item.id === task.id ? { ...item, ...task } : item));

    this._items.update(updateList);
    this._boardItems.update(updateList);
    this._calendarItems.update(updateList);
  }
}
