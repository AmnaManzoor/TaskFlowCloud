import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  AddProjectMemberRequest,
  ChangeProjectPriorityRequest,
  ChangeProjectStatusRequest,
  CreateProjectRequest,
  PagedResult,
  Project,
  ProjectListQuery,
  ProjectMember,
  ProjectSearchQuery,
  TransferProjectOwnershipRequest,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
} from '@features/projects/models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectApiService extends ApiBaseService {
  list(query: ProjectListQuery = {}): Observable<PagedResult<Project>> {
    return this.get<PagedResult<Project>>('/projects', { params: this.buildParams(query) });
  }

  search(query: ProjectSearchQuery = {}): Observable<PagedResult<Project>> {
    return this.get<PagedResult<Project>>('/projects/search', { params: this.buildParams(query) });
  }

  getById(id: string): Observable<Project> {
    return this.get<Project>(`/projects/${id}`);
  }

  create(request: CreateProjectRequest): Observable<Project> {
    return this.post<Project>('/projects', request);
  }

  update(id: string, request: UpdateProjectRequest): Observable<Project> {
    return this.put<Project>(`/projects/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return super.delete(`/projects/${id}`);
  }

  archive(id: string): Observable<Project> {
    return this.post<Project>(`/projects/${id}/archive`, {});
  }

  restore(id: string): Observable<Project> {
    return this.post<Project>(`/projects/${id}/restore`, {});
  }

  transferOwner(id: string, request: TransferProjectOwnershipRequest): Observable<Project> {
    return this.post<Project>(`/projects/${id}/transfer-owner`, request);
  }

  changeStatus(id: string, request: ChangeProjectStatusRequest): Observable<Project> {
    return this.patch<Project>(`/projects/${id}/status`, request);
  }

  changePriority(id: string, request: ChangeProjectPriorityRequest): Observable<Project> {
    return this.patch<Project>(`/projects/${id}/priority`, request);
  }

  listMembers(projectId: string): Observable<ProjectMember[]> {
    return this.get<ProjectMember[]>(`/projects/${projectId}/members`);
  }

  addMember(projectId: string, request: AddProjectMemberRequest): Observable<ProjectMember> {
    return this.post<ProjectMember>(`/projects/${projectId}/members`, request);
  }

  updateMemberRole(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberRoleRequest,
  ): Observable<ProjectMember> {
    return this.put<ProjectMember>(`/projects/${projectId}/members/${userId}`, request);
  }

  removeMember(projectId: string, userId: string): Observable<void> {
    return super.delete(`/projects/${projectId}/members/${userId}`);
  }

  private buildParams(
    query: ProjectListQuery | ProjectSearchQuery,
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
