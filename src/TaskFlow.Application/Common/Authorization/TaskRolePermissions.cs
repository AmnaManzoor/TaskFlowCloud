using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Common.Authorization;

public static class TaskRolePermissions
{
    public static bool CanRead(ProjectRole role) => ProjectRolePermissions.CanRead(role);

    public static bool CanCreateTask(ProjectRole role) =>
        role is ProjectRole.Owner or ProjectRole.Manager or ProjectRole.Contributor;

    public static bool CanManageAllTasks(ProjectRole role) =>
        role is ProjectRole.Owner or ProjectRole.Manager;

    public static bool CanUpdateAssignedTask(ProjectRole role) =>
        role is ProjectRole.Contributor;
}
