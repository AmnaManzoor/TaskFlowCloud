import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type { PagedResult } from '@features/organizations/models/common.models';
import type {
  AddOrganizationMemberRequest,
  CreateOrganizationRequest,
  Organization,
  OrganizationListQuery,
  OrganizationMember,
  UpdateOrganizationMemberRoleRequest,
  UpdateOrganizationRequest,
} from '@features/organizations/models/organization.models';

@Injectable({ providedIn: 'root' })
export class OrganizationService extends ApiBaseService {
  list(query: OrganizationListQuery = {}): Observable<PagedResult<Organization>> {
    return this.get<PagedResult<Organization>>('/organizations', { params: this.buildQueryParams(query) });
  }

  getById(id: string): Observable<Organization> {
    return this.get<Organization>(`/organizations/${id}`);
  }

  create(request: CreateOrganizationRequest): Observable<Organization> {
    return this.post<Organization>('/organizations', request);
  }

  update(id: string, request: UpdateOrganizationRequest): Observable<Organization> {
    return this.put<Organization>(`/organizations/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return super.delete(`/organizations/${id}`);
  }

  listMembers(organizationId: string): Observable<OrganizationMember[]> {
    return this.get<OrganizationMember[]>(`/organizations/${organizationId}/members`);
  }

  addMember(organizationId: string, request: AddOrganizationMemberRequest): Observable<OrganizationMember> {
    return this.post<OrganizationMember>(`/organizations/${organizationId}/members`, request);
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    request: UpdateOrganizationMemberRoleRequest,
  ): Observable<OrganizationMember> {
    return this.put<OrganizationMember>(`/organizations/${organizationId}/members/${userId}`, request);
  }

  removeMember(organizationId: string, userId: string): Observable<void> {
    return super.delete(`/organizations/${organizationId}/members/${userId}`);
  }

  private buildQueryParams(query: OrganizationListQuery): Record<string, string | number | boolean> {
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
