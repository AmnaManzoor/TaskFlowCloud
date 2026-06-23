export function hasSystemRole(systemRoles: readonly string[], ...roles: string[]): boolean {
  const normalized = new Set(systemRoles.map((role) => role.toLowerCase()));
  return roles.some((role) => normalized.has(role.toLowerCase()));
}

export function canCreateTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager', 'User');
}

export function canManageTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager', 'User');
}

export function canDeleteTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager');
}

export function canAssignTask(systemRoles: readonly string[]): boolean {
  return hasSystemRole(systemRoles, 'SuperAdmin', 'Admin', 'Manager', 'User');
}
