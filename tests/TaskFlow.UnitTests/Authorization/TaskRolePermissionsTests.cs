using TaskFlow.Application.Common.Authorization;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Authorization;

public class TaskRolePermissionsTests
{
    [Theory]
    [InlineData(ProjectRole.Viewer, false)]
    [InlineData(ProjectRole.Contributor, true)]
    [InlineData(ProjectRole.Manager, true)]
    [InlineData(ProjectRole.Owner, true)]
    public void CanCreateTask_ExcludesViewer(ProjectRole role, bool expected) =>
        Assert.Equal(expected, TaskRolePermissions.CanCreateTask(role));

    [Theory]
    [InlineData(ProjectRole.Viewer, false)]
    [InlineData(ProjectRole.Contributor, false)]
    [InlineData(ProjectRole.Manager, true)]
    [InlineData(ProjectRole.Owner, true)]
    public void CanManageAllTasks_OnlyManagerAndOwner(ProjectRole role, bool expected) =>
        Assert.Equal(expected, TaskRolePermissions.CanManageAllTasks(role));

    [Fact]
    public void CanUpdateAssignedTask_OnlyContributor() =>
        Assert.True(TaskRolePermissions.CanUpdateAssignedTask(ProjectRole.Contributor));
}
