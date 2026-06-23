using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Common.Authorization;

/// <summary>
/// Defines project-scoped permission checks by member role.
/// </summary>
public static class ProjectRolePermissions
{
    public static bool CanRead(ProjectRole role) => true;

    public static bool CanManageProject(ProjectRole role) =>
        role is ProjectRole.Owner or ProjectRole.Manager;

    public static bool CanManageMembers(ProjectRole role) =>
        role is ProjectRole.Owner or ProjectRole.Manager;

    public static bool CanDeleteOrArchive(ProjectRole role) =>
        role is ProjectRole.Owner;
}
