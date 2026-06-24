import { OrganizationMemberRole } from '@features/organizations/models/organization.models';
import { ProjectRole } from '@features/projects/models/project.enums';

export function hasSystemRole(systemRoles: readonly string[], ...roles: string[]): boolean {
  const normalized = new Set(systemRoles.map((role) => role.toLowerCase()));
  return roles.some((role) => normalized.has(role.toLowerCase()));
}

export function canCreateTaskInProject(
  systemRoles: readonly string[],
  projectRole?: ProjectRole,
  orgRole?: OrganizationMemberRole,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }

  if (
    orgRole === OrganizationMemberRole.Owner ||
    orgRole === OrganizationMemberRole.Administrator
  ) {
    return true;
  }

  return (
    projectRole === ProjectRole.Owner ||
    projectRole === ProjectRole.Manager ||
    projectRole === ProjectRole.Contributor
  );
}

export function canCreateTask(
  systemRoles: readonly string[],
  creatableProjectCount = 0,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }

  return creatableProjectCount > 0;
}

export function canManageTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager', 'Member');
}

export function canDeleteTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager');
}

export function canAssignTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager', 'Member');
}
