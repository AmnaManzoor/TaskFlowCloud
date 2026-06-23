using Microsoft.AspNetCore.Identity;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.Interfaces.Dashboard;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class ReportingAccessService(
    UserManager<ApplicationUser> userManager,
    IOrganizationAccessService organizationAccessService,
    IProjectAccessService projectAccessService) : IReportingAccessService
{
    public Task EnsureCanViewPersonalDashboardAsync(string currentUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            throw new UnauthorizedAccessException("User identifier is required.");
        }

        return Task.CompletedTask;
    }

    public Task EnsureCanViewProjectDashboardAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default) =>
        projectAccessService.EnsureCanReadProjectAsync(currentUserId, projectId, cancellationToken);

    public async Task EnsureCanViewOrganizationDashboardAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (await IsAppAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        var role = await organizationAccessService.GetMemberRoleAsync(currentUserId, organizationId, cancellationToken);
        if (role is null || !CanViewOrganizationDashboard(role.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to view this organization dashboard.");
        }
    }

    public async Task EnsureCanGenerateOrganizationReportAsync(
        string currentUserId,
        Guid? organizationId,
        CancellationToken cancellationToken = default)
    {
        if (await IsAppAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Organization scope is required for this report.");
        }

        var role = await organizationAccessService.GetMemberRoleAsync(currentUserId, organizationId.Value, cancellationToken);
        if (role is null || !OrganizationRolePermissions.CanManageOrganization(role.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to generate organization reports.");
        }
    }

    public async Task EnsureCanGenerateReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        if (await IsAppAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        if (query.ProjectId.HasValue)
        {
            await projectAccessService.EnsureCanReadProjectAsync(currentUserId, query.ProjectId.Value, cancellationToken);
            return;
        }

        if (query.OrganizationId.HasValue)
        {
            await EnsureCanGenerateOrganizationReportAsync(currentUserId, query.OrganizationId, cancellationToken);
            return;
        }

        if (!string.IsNullOrWhiteSpace(query.UserId)
            && !string.Equals(currentUserId, query.UserId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("You can only generate reports for your own user scope.");
        }
    }

    private async Task<bool> IsAppAdministratorAsync(string userId, CancellationToken cancellationToken)
    {
        if (await organizationAccessService.IsSuperAdminAsync(userId, cancellationToken))
        {
            return true;
        }

        var user = await userManager.FindByIdAsync(userId);
        return user is not null && await userManager.IsInRoleAsync(user, ApplicationRoles.Admin);
    }

    private static bool CanViewOrganizationDashboard(OrganizationMemberRole role) =>
        role is OrganizationMemberRole.Owner
            or OrganizationMemberRole.Administrator
            or OrganizationMemberRole.Manager;
}
