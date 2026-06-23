import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type { MessageResponse, PagedResult } from '@features/organizations/models/common.models';
import type {
  UpdateUserProfileRequest,
  UserDetail,
  UserListQuery,
  UserSummary,
} from '@features/organizations/models/user.models';

@Injectable({ providedIn: 'root' })
export class UserManagementService extends ApiBaseService {
  list(query: UserListQuery = {}): Observable<PagedResult<UserSummary>> {
    return this.get<PagedResult<UserSummary>>('/users', { params: this.buildQueryParams(query) });
  }

  getById(id: string): Observable<UserDetail> {
    return this.get<UserDetail>(`/users/${id}`);
  }

  getMe(): Observable<UserDetail> {
    return this.get<UserDetail>('/users/me');
  }

  updateProfile(id: string, request: UpdateUserProfileRequest): Observable<UserDetail> {
    return this.put<UserDetail>(`/users/${id}`, request);
  }

  activate(id: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(`/users/${id}/activate`, {});
  }

  deactivate(id: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(`/users/${id}/deactivate`, {});
  }

  lock(id: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(`/users/${id}/lock`, {});
  }

  unlock(id: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(`/users/${id}/unlock`, {});
  }

  private buildQueryParams(query: UserListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    if (query.page !== undefined) params['page'] = query.page;
    if (query.pageSize !== undefined) params['pageSize'] = query.pageSize;
    if (query.search) params['search'] = query.search;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.sortDescending !== undefined) params['sortDescending'] = query.sortDescending;
    if (query.isActive !== undefined && query.isActive !== null) params['isActive'] = query.isActive;
    return params;
  }
}
