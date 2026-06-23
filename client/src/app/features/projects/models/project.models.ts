import type { ProjectPriority, ProjectRole, ProjectStatus } from '@features/projects/models/project.enums';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProjectSummaryMeta {
  memberCount: number;
  taskCount: number;
  ownerEmail: string;
  ownerFullName: string;
  organizationName: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string | null;
  endDate: string | null;
  estimatedCompletionDate: string | null;
  ownerId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string | null;
  rowVersion: string;
  summary?: ProjectSummaryMeta | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface CreateProjectRequest {
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string | null;
  endDate?: string | null;
  estimatedCompletionDate?: string | null;
  ownerId?: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  estimatedCompletionDate?: string | null;
  rowVersion: string;
}

export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  organizationId?: string | null;
  search?: string | null;
  status?: ProjectStatus | null;
  priority?: ProjectPriority | null;
  isArchived?: boolean | null;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface ProjectSearchQuery {
  page?: number;
  pageSize?: number;
  name?: string | null;
  code?: string | null;
  status?: ProjectStatus | null;
  priority?: ProjectPriority | null;
  organizationId?: string | null;
  ownerId?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  isArchived?: boolean | null;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface AddProjectMemberRequest {
  userId: string;
  role: ProjectRole;
}

export interface UpdateProjectMemberRoleRequest {
  role: ProjectRole;
}

export interface TransferProjectOwnershipRequest {
  newOwnerId: string;
}

export interface ChangeProjectStatusRequest {
  status: ProjectStatus;
}

export interface ChangeProjectPriorityRequest {
  priority: ProjectPriority;
}

export interface ProjectFilters {
  organizationId: string | null;
  status: ProjectStatus | null;
  priority: ProjectPriority | null;
  isArchived: boolean | null;
  ownerId: string | null;
}
