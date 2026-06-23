import type { ListQuery } from '@features/organizations/models/common.models';

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateTeamRequest {
  organizationId: string;
  name: string;
  description?: string | null;
}

export interface UpdateTeamRequest {
  name: string;
  description?: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
}

export interface AddTeamMemberRequest {
  userId: string;
}

export interface TeamListQuery extends ListQuery {
  organizationId?: string | null;
}
