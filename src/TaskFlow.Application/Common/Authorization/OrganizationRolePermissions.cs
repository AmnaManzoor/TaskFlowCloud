using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Common.Authorization;

/// <summary>
/// Defines organization-scoped permission checks by member role.
/// </summary>
public static class OrganizationRolePermissions
{
    public static bool CanManageOrganization(OrganizationMemberRole role) =>
        role is OrganizationMemberRole.Owner or OrganizationMemberRole.Administrator;

    public static bool CanManageTeams(OrganizationMemberRole role) =>
        role is OrganizationMemberRole.Owner
            or OrganizationMemberRole.Administrator
            or OrganizationMemberRole.Manager;

    public static bool CanRead(OrganizationMemberRole role) => true;

    public static bool CanManageMembers(OrganizationMemberRole role) =>
        CanManageOrganization(role);

    public static bool CanManageProjects(OrganizationMemberRole role) =>
        role is OrganizationMemberRole.Owner or OrganizationMemberRole.Administrator;
}
