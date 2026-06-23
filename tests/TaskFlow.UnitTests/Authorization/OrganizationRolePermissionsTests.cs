using TaskFlow.Application.Common.Authorization;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Authorization;

public class OrganizationRolePermissionsTests
{
    [Theory]
    [InlineData(OrganizationMemberRole.Owner, true)]
    [InlineData(OrganizationMemberRole.Administrator, true)]
    [InlineData(OrganizationMemberRole.Manager, false)]
    [InlineData(OrganizationMemberRole.Member, false)]
    public void CanManageOrganization_ReturnsExpected(OrganizationMemberRole role, bool expected)
    {
        Assert.Equal(expected, OrganizationRolePermissions.CanManageOrganization(role));
    }

    [Theory]
    [InlineData(OrganizationMemberRole.Owner, true)]
    [InlineData(OrganizationMemberRole.Administrator, true)]
    [InlineData(OrganizationMemberRole.Manager, true)]
    [InlineData(OrganizationMemberRole.Member, false)]
    public void CanManageTeams_ReturnsExpected(OrganizationMemberRole role, bool expected)
    {
        Assert.Equal(expected, OrganizationRolePermissions.CanManageTeams(role));
    }
}
