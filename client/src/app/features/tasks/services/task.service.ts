import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskApiService } from '@features/tasks/services/task-api.service';
import type { PagedResult, Task, TaskFilters } from '@features/tasks/models/task.models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly taskApi = inject(TaskApiService);

  loadTasks(
    page: number,
    pageSize: number,
    search: string,
    filters: TaskFilters,
    sortBy: string,
    sortDescending: boolean,
  ): Observable<PagedResult<Task>> {
    const hasAdvancedFilters =
      filters.assigneeId ||
      filters.labelId ||
      filters.dueDateFrom ||
      filters.dueDateTo ||
      filters.createdFrom ||
      filters.createdTo;

    if (hasAdvancedFilters || search.includes(' ')) {
      return this.taskApi.search({
        page,
        pageSize,
        title: search || undefined,
        projectId: filters.projectId ?? undefined,
        status: filters.status ?? undefined,
        priority: filters.priority ?? undefined,
        type: filters.type ?? undefined,
        assigneeId: filters.assigneeId ?? undefined,
        labelId: filters.labelId ?? undefined,
        dueDateFrom: filters.dueDateFrom ?? undefined,
        dueDateTo: filters.dueDateTo ?? undefined,
        sortBy,
        sortDescending,
      });
    }

    return this.taskApi.list({
      page,
      pageSize,
      search: search || undefined,
      projectId: filters.projectId ?? undefined,
      status: filters.status ?? undefined,
      priority: filters.priority ?? undefined,
      type: filters.type ?? undefined,
      sortBy,
      sortDescending,
    });
  }

  loadBoardTasks(projectId: string | null, search: string, filters: TaskFilters): Observable<PagedResult<Task>> {
    return this.taskApi.list({
      page: 1,
      pageSize: 100,
      search: search || undefined,
      projectId: projectId ?? filters.projectId ?? undefined,
      priority: filters.priority ?? undefined,
      type: filters.type ?? undefined,
      sortBy: 'updatedAt',
      sortDescending: true,
    });
  }

  loadCalendarTasks(
    projectId: string | null,
    dueDateFrom: string,
    dueDateTo: string,
    filters: TaskFilters,
  ): Observable<PagedResult<Task>> {
    return this.taskApi.search({
      page: 1,
      pageSize: 100,
      projectId: projectId ?? filters.projectId ?? undefined,
      dueDateFrom,
      dueDateTo,
      priority: filters.priority ?? undefined,
      type: filters.type ?? undefined,
      assigneeId: filters.assigneeId ?? undefined,
      sortBy: 'dueDate',
      sortDescending: false,
    });
  }

  getTask(id: string): Observable<Task> {
    return this.taskApi.getById(id);
  }
}
