import type { ListQuery } from '@features/organizations/models/common.models';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  isLockedOut: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserDetail extends UserSummary {
  systemRoles: string[];
  updatedAt: string | null;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

export interface UserListQuery extends ListQuery {
  isActive?: boolean | null;
}
