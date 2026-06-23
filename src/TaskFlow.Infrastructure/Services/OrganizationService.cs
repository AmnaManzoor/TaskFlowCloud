using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class OrganizationService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOrganizationAccessService accessService,
    INotificationTriggerService notificationTriggers,
    IAuditTriggerService auditTriggers,
    ILogger<OrganizationService> logger) : IOrganizationService
{
    public async Task<OrganizationResponse> CreateAsync(
        string currentUserId,
        CreateOrganizationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Organizations.AnyAsync(
                organization => organization.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("An organization with this name already exists.");
        }

        var organization = Organization.Create(request.Name, request.Description, request.LogoUrl);
        dbContext.Organizations.Add(organization);

        var ownerMembership = OrganizationMember.Create(
            organization.Id,
            currentUserId,
            OrganizationMemberRole.Owner);

        dbContext.OrganizationMembers.Add(ownerMembership);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Organization {OrganizationId} created by user {UserId}", organization.Id, currentUserId);

        await auditTriggers.LogOrganizationCreatedAsync(organization.Id, currentUserId, cancellationToken);

        return MapOrganization(organization);
    }

    public async Task<OrganizationResponse> UpdateAsync(
        string currentUserId,
        Guid organizationId,
        UpdateOrganizationRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var organization = await dbContext.Organizations
            .SingleOrDefaultAsync(entry => entry.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        if (await dbContext.Organizations.AnyAsync(
                entry => entry.Id != organizationId && entry.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("An organization with this name already exists.");
        }

        organization.Update(request.Name, request.Description, request.LogoUrl, request.IsActive);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Organization {OrganizationId} updated by user {UserId}", organizationId, currentUserId);

        return MapOrganization(organization);
    }

    public async Task DeleteAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var organization = await dbContext.Organizations
            .SingleOrDefaultAsync(entry => entry.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        if (await HasActiveProjectsAsync(organizationId, cancellationToken))
        {
            throw new InvalidOperationException("Cannot delete an organization that has active projects.");
        }

        organization.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Organization {OrganizationId} deleted by user {UserId}", organizationId, currentUserId);
    }

    public async Task<OrganizationResponse> GetByIdAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var organization = await dbContext.Organizations
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        return MapOrganization(organization);
    }

    public async Task<PagedResult<OrganizationResponse>> GetAllAsync(
        string currentUserId,
        OrganizationListQuery query,
        CancellationToken cancellationToken = default)
    {
        var isSuperAdmin = await accessService.IsSuperAdminAsync(currentUserId, cancellationToken);

        var organizations = dbContext.Organizations.AsNoTracking().AsQueryable();

        if (!isSuperAdmin)
        {
            var memberOrganizationIds = dbContext.OrganizationMembers
                .Where(member => member.UserId == currentUserId)
                .Select(member => member.OrganizationId);

            organizations = organizations.Where(organization => memberOrganizationIds.Contains(organization.Id));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            organizations = organizations.Where(organization =>
                organization.Name.Contains(search) ||
                (organization.Description != null && organization.Description.Contains(search)));
        }

        if (query.IsActive.HasValue)
        {
            organizations = organizations.Where(organization => organization.IsActive == query.IsActive.Value);
        }

        organizations = ApplySorting(organizations, query.SortBy, query.SortDescending);

        var totalCount = await organizations.CountAsync(cancellationToken);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await organizations
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(organization => MapOrganization(organization))
            .ToListAsync(cancellationToken);

        return new PagedResult<OrganizationResponse>(items, page, pageSize, totalCount);
    }

    public async Task<OrganizationMemberResponse> AddMemberAsync(
        string currentUserId,
        Guid organizationId,
        AddOrganizationMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new InvalidOperationException("User not found.");

        await EnsureUserIsActiveAsync(user);

        if (await dbContext.OrganizationMembers.AnyAsync(
                member => member.OrganizationId == organizationId && member.UserId == request.UserId,
                cancellationToken))
        {
            throw new InvalidOperationException("User is already a member of this organization.");
        }

        if (request.Role == OrganizationMemberRole.Owner)
        {
            throw new InvalidOperationException("Owner role cannot be assigned directly. Transfer ownership instead.");
        }

        var member = OrganizationMember.Create(organizationId, request.UserId, request.Role);
        dbContext.OrganizationMembers.Add(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} added to organization {OrganizationId} by user {CurrentUserId}",
            request.UserId,
            organizationId,
            currentUserId);

        await notificationTriggers.NotifyOrganizationMemberAddedAsync(organizationId, request.UserId, cancellationToken);
        await auditTriggers.LogMemberAddedAsync(
            AuditEntityTypes.OrganizationMember,
            organizationId,
            request.UserId,
            currentUserId,
            cancellationToken);

        return MapMember(member, user);
    }

    public async Task RemoveMemberAsync(
        string currentUserId,
        Guid organizationId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var member = await dbContext.OrganizationMembers
            .SingleOrDefaultAsync(
                entry => entry.OrganizationId == organizationId && entry.UserId == userId,
                cancellationToken)
            ?? throw new KeyNotFoundException("Organization member not found.");

        if (member.Role == OrganizationMemberRole.Owner)
        {
            throw new InvalidOperationException("Cannot remove the organization owner.");
        }

        dbContext.OrganizationMembers.Remove(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} removed from organization {OrganizationId} by user {CurrentUserId}",
            userId,
            organizationId,
            currentUserId);

        await auditTriggers.LogMemberRemovedAsync(
            AuditEntityTypes.OrganizationMember,
            organizationId,
            userId,
            currentUserId,
            cancellationToken);
    }

    public async Task<OrganizationMemberResponse> UpdateMemberRoleAsync(
        string currentUserId,
        Guid organizationId,
        string userId,
        UpdateOrganizationMemberRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageOrganizationAsync(currentUserId, organizationId, cancellationToken);

        if (currentUserId == userId)
        {
            throw new InvalidOperationException("You cannot change your own organization role.");
        }

        var member = await dbContext.OrganizationMembers
            .SingleOrDefaultAsync(
                entry => entry.OrganizationId == organizationId && entry.UserId == userId,
                cancellationToken)
            ?? throw new KeyNotFoundException("Organization member not found.");

        if (member.Role == OrganizationMemberRole.Owner || request.Role == OrganizationMemberRole.Owner)
        {
            throw new InvalidOperationException("Owner role cannot be changed through this endpoint.");
        }

        member.UpdateRole(request.Role);
        await dbContext.SaveChangesAsync(cancellationToken);

        await notificationTriggers.NotifyOrganizationRoleChangedAsync(
            organizationId,
            userId,
            request.Role,
            cancellationToken);

        await auditTriggers.LogRoleChangedAsync(organizationId, userId, request.Role, currentUserId, cancellationToken);

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("User not found.");

        return MapMember(member, user);
    }

    public async Task<IReadOnlyList<OrganizationMemberResponse>> GetMembersAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadOrganizationAsync(currentUserId, organizationId, cancellationToken);

        var members = await dbContext.OrganizationMembers
            .AsNoTracking()
            .Where(member => member.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        var userIds = members.Select(member => member.UserId).ToList();
        var users = await userManager.Users
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        return members
            .Select(member => MapMember(member, users[member.UserId]))
            .ToList();
    }

    private static IQueryable<Organization> ApplySorting(
        IQueryable<Organization> query,
        string? sortBy,
        bool sortDescending)
    {
        return (sortBy?.ToLowerInvariant()) switch
        {
            "createdat" => sortDescending
                ? query.OrderByDescending(organization => organization.CreatedAt)
                : query.OrderBy(organization => organization.CreatedAt),
            "isactive" => sortDescending
                ? query.OrderByDescending(organization => organization.IsActive)
                : query.OrderBy(organization => organization.IsActive),
            _ => sortDescending
                ? query.OrderByDescending(organization => organization.Name)
                : query.OrderBy(organization => organization.Name)
        };
    }

    private async Task<bool> HasActiveProjectsAsync(Guid organizationId, CancellationToken cancellationToken) =>
        await dbContext.Projects.AnyAsync(
            project => project.OrganizationId == organizationId
                && !project.IsDeleted
                && !project.IsArchived
                && project.Status != ProjectStatus.Completed
                && project.Status != ProjectStatus.Cancelled,
            cancellationToken);

    private static async Task EnsureUserIsActiveAsync(ApplicationUser user)
    {
        if (!user.IsActive)
        {
            throw new InvalidOperationException("Inactive users cannot be assigned to organizations or teams.");
        }

        await Task.CompletedTask;
    }

    private static OrganizationResponse MapOrganization(Organization organization) =>
        new(
            organization.Id,
            organization.Name,
            organization.Description,
            organization.LogoUrl,
            organization.IsActive,
            organization.CreatedAt,
            organization.UpdatedAt);

    private static OrganizationMemberResponse MapMember(OrganizationMember member, ApplicationUser user) =>
        new(
            member.Id,
            member.OrganizationId,
            member.UserId,
            user.Email!,
            user.FirstName,
            user.LastName,
            member.Role,
            member.JoinedAt);
}
