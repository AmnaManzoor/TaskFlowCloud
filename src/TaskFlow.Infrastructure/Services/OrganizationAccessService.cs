using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class OrganizationAccessService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager) : IOrganizationAccessService
{
    public async Task<bool> IsSuperAdminAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is not null && await userManager.IsInRoleAsync(user, ApplicationRoles.SuperAdmin);
    }

    public async Task<OrganizationMemberRole?> GetMemberRoleAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return OrganizationMemberRole.Owner;
        }

        var member = await dbContext.OrganizationMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(
                entry => entry.OrganizationId == organizationId && entry.UserId == userId,
                cancellationToken);

        return member?.Role;
    }

    public async Task EnsureCanReadOrganizationAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetMemberRoleAsync(userId, organizationId, cancellationToken);
        if (role is null)
        {
            throw new UnauthorizedAccessException("You do not have access to this organization.");
        }
    }

    public async Task EnsureCanManageOrganizationAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetMemberRoleAsync(userId, organizationId, cancellationToken);
        if (role is null || !OrganizationRolePermissions.CanManageOrganization(role.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to manage this organization.");
        }
    }

    public async Task EnsureCanManageTeamsAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetMemberRoleAsync(userId, organizationId, cancellationToken);
        if (role is null || !OrganizationRolePermissions.CanManageTeams(role.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to manage teams in this organization.");
        }
    }
}
