import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectApiService } from '@features/projects/services/project-api.service';
import type {
  CreateProjectRequest,
  PagedResult,
  Project,
  ProjectFilters,
  ProjectMember,
  UpdateProjectRequest,
} from '@features/projects/models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ProjectApiService);

  loadProjects(
    page: number,
    pageSize: number,
    search: string,
    filters: ProjectFilters,
    sortBy: string,
    sortDescending: boolean,
  ): Observable<PagedResult<Project>> {
    const query = {
      page,
      pageSize,
      search: search || undefined,
      organizationId: filters.organizationId ?? undefined,
      status: filters.status ?? undefined,
      priority: filters.priority ?? undefined,
      isArchived: filters.isArchived ?? undefined,
      sortBy,
      sortDescending,
      ownerId: filters.ownerId ?? undefined,
      name: search || undefined,
    };

    if (filters.ownerId) {
      return this.api.search(query);
    }

    return this.api.list(query);
  }

  getProject(id: string): Observable<Project> {
    return this.api.getById(id);
  }

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.api.create(request);
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<Project> {
    return this.api.update(id, request);
  }

  getMembers(projectId: string): Observable<ProjectMember[]> {
    return this.api.listMembers(projectId);
  }

  archiveProject(id: string): Observable<Project> {
    return this.api.archive(id);
  }

  restoreProject(id: string): Observable<Project> {
    return this.api.restore(id);
  }

  deleteProject(id: string): Observable<void> {
    return this.api.remove(id);
  }
}
