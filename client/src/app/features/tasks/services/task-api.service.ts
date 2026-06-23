import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  ActivityHistoryItem,
  ActivityListQuery,
  AddTaskLabelRequest,
  AssignTaskUsersRequest,
  ChangeTaskPriorityRequest,
  ChangeTaskStatusRequest,
  ChecklistItem,
  CreateChecklistRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  PagedResult,
  Task,
  TaskListQuery,
  TaskSearchQuery,
  UpdateChecklistRequest,
  UpdateTaskHoursRequest,
  UpdateTaskRequest,
} from '@features/tasks/models/task.models';

@Injectable({ providedIn: 'root' })
export class TaskApiService extends ApiBaseService {
  list(query: TaskListQuery = {}): Observable<PagedResult<Task>> {
    return this.get<PagedResult<Task>>('/tasks', { params: this.buildParams(query) });
  }

  search(query: TaskSearchQuery = {}): Observable<PagedResult<Task>> {
    return this.get<PagedResult<Task>>('/tasks/search', { params: this.buildParams(query) });
  }

  getById(id: string): Observable<Task> {
    return this.get<Task>(`/tasks/${id}`);
  }

  create(request: CreateTaskRequest): Observable<Task> {
    return this.post<Task>('/tasks', request);
  }

  update(id: string, request: UpdateTaskRequest): Observable<Task> {
    return this.put<Task>(`/tasks/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return super.delete(`/tasks/${id}`);
  }

  archive(id: string): Observable<Task> {
    return this.post<Task>(`/tasks/${id}/archive`, {});
  }

  restore(id: string): Observable<Task> {
    return this.post<Task>(`/tasks/${id}/restore`, {});
  }

  assign(id: string, request: AssignTaskUsersRequest): Observable<Task> {
    return this.post<Task>(`/tasks/${id}/assign`, request);
  }

  unassign(id: string, userId: string): Observable<void> {
    return super.delete(`/tasks/${id}/assign/${userId}`);
  }

  changeStatus(id: string, request: ChangeTaskStatusRequest): Observable<Task> {
    return this.patch<Task>(`/tasks/${id}/status`, request);
  }

  changePriority(id: string, request: ChangeTaskPriorityRequest): Observable<Task> {
    return this.patch<Task>(`/tasks/${id}/priority`, request);
  }

  updateHours(id: string, request: UpdateTaskHoursRequest): Observable<Task> {
    return this.patch<Task>(`/tasks/${id}/hours`, request);
  }

  move(id: string, request: MoveTaskRequest): Observable<Task> {
    return this.post<Task>(`/tasks/${id}/move`, request);
  }

  addLabel(id: string, request: AddTaskLabelRequest): Observable<Task> {
    return this.post<Task>(`/tasks/${id}/labels`, request);
  }

  removeLabel(id: string, labelId: string): Observable<void> {
    return super.delete(`/tasks/${id}/labels/${labelId}`);
  }

  createChecklist(id: string, request: CreateChecklistRequest): Observable<ChecklistItem> {
    return this.post<ChecklistItem>(`/tasks/${id}/checklists`, request);
  }

  updateChecklist(
    taskId: string,
    checklistId: string,
    request: UpdateChecklistRequest,
  ): Observable<ChecklistItem> {
    return this.put<ChecklistItem>(`/tasks/${taskId}/checklists/${checklistId}`, request);
  }

  removeChecklist(taskId: string, checklistId: string): Observable<void> {
    return super.delete(`/tasks/${taskId}/checklists/${checklistId}`);
  }

  listActivity(query: ActivityListQuery = {}): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>('/activity', { params: this.buildParams(query) });
  }

  private buildParams(
    query: TaskListQuery | TaskSearchQuery | ActivityListQuery,
  ): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number | boolean;
      }
    }
    return params;
  }
}
