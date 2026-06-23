import { OrganizationMemberRole } from '@features/organizations/models/organization.models';

const ORG_ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  [OrganizationMemberRole.Member]: 'Member',
  [OrganizationMemberRole.Manager]: 'Manager',
  [OrganizationMemberRole.Administrator]: 'Administrator',
  [OrganizationMemberRole.Owner]: 'Owner',
};

export function organizationRoleLabel(role: OrganizationMemberRole): string {
  return ORG_ROLE_LABELS[role] ?? 'Member';
}

export function canManageOrganization(
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

export function canManageTeams(
  systemRoles: readonly string[],
  orgRole?: OrganizationMemberRole,
): boolean {
  if (hasSystemRole(systemRoles, 'SuperAdmin', 'Admin')) {
    return true;
  }

  return (
    orgRole === OrganizationMemberRole.Owner ||
    orgRole === OrganizationMemberRole.Administrator ||
    orgRole === OrganizationMemberRole.Manager
  );
}

export function canManageUsers(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin');
}

export function hasSystemRole(systemRoles: readonly string[], ...roles: string[]): boolean {
  const normalized = new Set(systemRoles.map((role) => role.toLowerCase()));
  return roles.some((role) => normalized.has(role.toLowerCase()));
}
