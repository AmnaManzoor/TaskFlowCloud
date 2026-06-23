import { OrganizationMemberRole } from '@features/organizations/models/organization.models';
import { ProjectRole } from '@features/projects/models/project.enums';
import type { ProjectMember } from '@features/projects/models/project.models';

export function hasSystemRole(systemRoles: readonly string[], ...roles: string[]): boolean {
  const normalized = new Set(systemRoles.map((role) => role.toLowerCase()));
  return roles.some((role) => normalized.has(role.toLowerCase()));
}

export function canCreateProjectInOrganization(
  systemRoles: readonly string[],
  orgRole?: OrganizationMemberRole,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }

  return (
    orgRole === OrganizationMemberRole.Owner || orgRole === OrganizationMemberRole.Administrator
  );
}

export function canCreateProject(
  systemRoles: readonly string[],
  creatableOrganizationCount = 0,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }

  return creatableOrganizationCount > 0;
}

export function canManageProject(
  systemRoles: readonly string[],
  memberRole?: ProjectRole,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }
  return memberRole === ProjectRole.Owner || memberRole === ProjectRole.Manager;
}

export function canDeleteOrArchiveProject(
  systemRoles: readonly string[],
  memberRole?: ProjectRole,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }
  return memberRole === ProjectRole.Owner;
}

export function canManageProjectMembers(
  systemRoles: readonly string[],
  memberRole?: ProjectRole,
): boolean {
  return canManageProject(systemRoles, memberRole);
}

export function canTransferOwnership(
  systemRoles: readonly string[],
  memberRole?: ProjectRole,
): boolean {
  return canDeleteOrArchiveProject(systemRoles, memberRole);
}

export function currentMemberRole(
  members: readonly ProjectMember[],
  userId: string | undefined,
): ProjectRole | undefined {
  if (!userId) {
    return undefined;
  }
  return members.find((member) => member.userId === userId)?.role;
}
