import type { ListQuery } from '@features/organizations/models/common.models';

export enum OrganizationMemberRole {
  Member = 0,
  Manager = 1,
  Administrator = 2,
  Owner = 3,
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface UpdateOrganizationRequest {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: OrganizationMemberRole;
  joinedAt: string;
}

export interface AddOrganizationMemberRequest {
  userId: string;
  role: OrganizationMemberRole;
}

export interface UpdateOrganizationMemberRoleRequest {
  role: OrganizationMemberRole;
}

export interface OrganizationListQuery extends ListQuery {
  isActive?: boolean | null;
}
