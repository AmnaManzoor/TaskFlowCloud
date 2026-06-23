using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class AuditAccessService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOrganizationAccessService organizationAccessService) : IAuditAccessService
{
    public async Task EnsureCanViewAuditLogsAsync(string currentUserId, CancellationToken cancellationToken = default)
    {
        if (await IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        var ownsAnyOrganization = await dbContext.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                member => member.UserId == currentUserId && member.Role == OrganizationMemberRole.Owner,
                cancellationToken);

        if (ownsAnyOrganization)
        {
            return;
        }

        throw new UnauthorizedAccessException("You do not have permission to view audit logs.");
    }

    public async Task EnsureCanViewUserAuditLogsAsync(
        string currentUserId,
        string targetUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(currentUserId, targetUserId, StringComparison.Ordinal))
        {
            return;
        }

        if (await IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        var targetOrganizationIds = await dbContext.OrganizationMembers
            .AsNoTracking()
            .Where(member => member.UserId == targetUserId)
            .Select(member => member.OrganizationId)
            .ToListAsync(cancellationToken);

        foreach (var organizationId in targetOrganizationIds)
        {
            if (await IsOrganizationOwnerAsync(currentUserId, organizationId, cancellationToken))
            {
                return;
            }
        }

        throw new UnauthorizedAccessException("You do not have permission to view audit logs for this user.");
    }

    public async Task EnsureCanViewEntityAuditLogsAsync(
        string currentUserId,
        string entityType,
        Guid entityId,
        CancellationToken cancellationToken = default)
    {
        if (await IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        var organizationId = await ResolveOrganizationIdAsync(entityType, entityId, cancellationToken);
        if (organizationId.HasValue && await IsOrganizationOwnerAsync(currentUserId, organizationId.Value, cancellationToken))
        {
            return;
        }

        throw new UnauthorizedAccessException("You do not have permission to view audit logs for this entity.");
    }

    public async Task<bool> IsAuditAdministratorAsync(string currentUserId, CancellationToken cancellationToken = default)
    {
        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return true;
        }

        var user = await userManager.FindByIdAsync(currentUserId);
        return user is not null && await userManager.IsInRoleAsync(user, ApplicationRoles.Admin);
    }

    public async Task<bool> IsOrganizationOwnerAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return true;
        }

        var role = await organizationAccessService.GetMemberRoleAsync(currentUserId, organizationId, cancellationToken);
        return role == OrganizationMemberRole.Owner;
    }

    private async Task<Guid?> ResolveOrganizationIdAsync(
        string entityType,
        Guid entityId,
        CancellationToken cancellationToken)
    {
        return entityType switch
        {
            AuditEntityTypes.Organization => entityId,
            AuditEntityTypes.Team => await dbContext.Teams
                .AsNoTracking()
                .Where(team => team.Id == entityId)
                .Select(team => (Guid?)team.OrganizationId)
                .SingleOrDefaultAsync(cancellationToken),
            AuditEntityTypes.Project => await dbContext.Projects
                .AsNoTracking()
                .Where(project => project.Id == entityId)
                .Select(project => (Guid?)project.OrganizationId)
                .SingleOrDefaultAsync(cancellationToken),
            AuditEntityTypes.Task => await dbContext.Tasks
                .AsNoTracking()
                .Where(task => task.Id == entityId)
                .Join(
                    dbContext.Projects.AsNoTracking(),
                    task => task.ProjectId,
                    project => project.Id,
                    (_, project) => (Guid?)project.OrganizationId)
                .SingleOrDefaultAsync(cancellationToken),
            AuditEntityTypes.Comment => await dbContext.TaskComments
                .AsNoTracking()
                .Where(comment => comment.Id == entityId)
                .Join(
                    dbContext.Tasks.AsNoTracking(),
                    comment => comment.TaskId,
                    task => task.Id,
                    (_, task) => task.ProjectId)
                .Join(
                    dbContext.Projects.AsNoTracking(),
                    projectId => projectId,
                    project => project.Id,
                    (_, project) => (Guid?)project.OrganizationId)
                .SingleOrDefaultAsync(cancellationToken),
            AuditEntityTypes.Attachment => await dbContext.Attachments
                .AsNoTracking()
                .Where(attachment => attachment.Id == entityId)
                .Join(
                    dbContext.Tasks.AsNoTracking(),
                    attachment => attachment.TaskId,
                    task => task.Id,
                    (_, task) => task.ProjectId)
                .Join(
                    dbContext.Projects.AsNoTracking(),
                    projectId => projectId,
                    project => project.Id,
                    (_, project) => (Guid?)project.OrganizationId)
                .SingleOrDefaultAsync(cancellationToken),
            _ => null
        };
    }
}
