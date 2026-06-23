import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type { PagedResult } from '@features/organizations/models/common.models';
import type {
  AddTeamMemberRequest,
  CreateTeamRequest,
  Team,
  TeamListQuery,
  TeamMember,
  UpdateTeamRequest,
} from '@features/organizations/models/team.models';

@Injectable({ providedIn: 'root' })
export class TeamService extends ApiBaseService {
  list(query: TeamListQuery = {}): Observable<PagedResult<Team>> {
    return this.get<PagedResult<Team>>('/teams', { params: this.buildQueryParams(query) });
  }

  getById(id: string): Observable<Team> {
    return this.get<Team>(`/teams/${id}`);
  }

  create(request: CreateTeamRequest): Observable<Team> {
    return this.post<Team>('/teams', request);
  }

  update(id: string, request: UpdateTeamRequest): Observable<Team> {
    return this.put<Team>(`/teams/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return super.delete(`/teams/${id}`);
  }

  listMembers(teamId: string): Observable<TeamMember[]> {
    return this.get<TeamMember[]>(`/teams/${teamId}/members`);
  }

  addMember(teamId: string, request: AddTeamMemberRequest): Observable<TeamMember> {
    return this.post<TeamMember>(`/teams/${teamId}/members`, request);
  }

  removeMember(teamId: string, userId: string): Observable<void> {
    return super.delete(`/teams/${teamId}/members/${userId}`);
  }

  private buildQueryParams(query: TeamListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    if (query.organizationId) params['organizationId'] = query.organizationId;
    if (query.page !== undefined) params['page'] = query.page;
    if (query.pageSize !== undefined) params['pageSize'] = query.pageSize;
    if (query.search) params['search'] = query.search;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.sortDescending !== undefined) params['sortDescending'] = query.sortDescending;
    return params;
  }
}
