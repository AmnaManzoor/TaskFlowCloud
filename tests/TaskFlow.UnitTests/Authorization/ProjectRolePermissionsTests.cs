using TaskFlow.Application.Common.Authorization;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Authorization;

public class ProjectRolePermissionsTests
{
    [Theory]
    [InlineData(ProjectRole.Viewer, true)]
    [InlineData(ProjectRole.Contributor, true)]
    [InlineData(ProjectRole.Manager, true)]
    [InlineData(ProjectRole.Owner, true)]
    public void CanRead_AllRoles_ReturnsTrue(ProjectRole role, bool expected) =>
        Assert.Equal(expected, ProjectRolePermissions.CanRead(role));

    [Theory]
    [InlineData(ProjectRole.Viewer, false)]
    [InlineData(ProjectRole.Contributor, false)]
    [InlineData(ProjectRole.Manager, true)]
    [InlineData(ProjectRole.Owner, true)]
    public void CanManageProject_OnlyOwnerAndManager(ProjectRole role, bool expected) =>
        Assert.Equal(expected, ProjectRolePermissions.CanManageProject(role));

    [Theory]
    [InlineData(ProjectRole.Viewer, false)]
    [InlineData(ProjectRole.Owner, true)]
    public void CanDeleteOrArchive_OnlyOwner(ProjectRole role, bool expected) =>
        Assert.Equal(expected, ProjectRolePermissions.CanDeleteOrArchive(role));

    [Theory]
    [InlineData(OrganizationMemberRole.Owner, true)]
    [InlineData(OrganizationMemberRole.Administrator, true)]
    [InlineData(OrganizationMemberRole.Manager, false)]
    [InlineData(OrganizationMemberRole.Member, false)]
    public void CanManageProjects_OnlyOwnerAndAdministrator(OrganizationMemberRole role, bool expected) =>
        Assert.Equal(expected, OrganizationRolePermissions.CanManageProjects(role));
}
