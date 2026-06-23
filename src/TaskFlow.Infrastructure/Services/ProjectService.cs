using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class ProjectService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IProjectAccessService accessService,
    IOrganizationAccessService organizationAccessService,
    INotificationTriggerService notificationTriggers,
    IAuditTriggerService auditTriggers,
    ILogger<ProjectService> logger) : IProjectService
{
    public async Task<ProjectResponse> CreateAsync(
        string currentUserId,
        CreateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanCreateProjectAsync(currentUserId, request.OrganizationId, cancellationToken);

        _ = await dbContext.Organizations
            .AsNoTracking()
            .SingleOrDefaultAsync(organization => organization.Id == request.OrganizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        if (await dbContext.Projects.AnyAsync(
                project => project.OrganizationId == request.OrganizationId && project.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("A project with this name already exists in the organization.");
        }

        var normalizedCode = request.Code.ToUpperInvariant();
        if (await dbContext.Projects.AnyAsync(project => project.Code == normalizedCode, cancellationToken))
        {
            throw new InvalidOperationException("A project with this code already exists.");
        }

        var ownerId = string.IsNullOrWhiteSpace(request.OwnerId) ? currentUserId : request.OwnerId;
        var owner = await userManager.FindByIdAsync(ownerId)
            ?? throw new InvalidOperationException("Project owner not found.");

        await EnsureUserIsActiveAsync(owner);
        await organizationAccessService.EnsureCanReadOrganizationAsync(ownerId, request.OrganizationId, cancellationToken);

        var project = Project.Create(
            request.OrganizationId,
            request.Name,
            request.Code,
            request.Description,
            request.Status,
            request.Priority,
            request.StartDate,
            request.EndDate,
            request.EstimatedCompletionDate,
            ownerId);

        dbContext.Projects.Add(project);
        dbContext.ProjectMembers.Add(ProjectMember.Create(project.Id, ownerId, ProjectRole.Owner));

        await SaveChangesWithConcurrencyAsync(cancellationToken);

        logger.LogInformation(
            "Project {ProjectId} created in organization {OrganizationId} by user {UserId}",
            project.Id,
            request.OrganizationId,
            currentUserId);

        await notificationTriggers.NotifyProjectCreatedAsync(project.Id, currentUserId, cancellationToken);
        await auditTriggers.LogProjectCreatedAsync(project.Id, currentUserId, cancellationToken);

        return await MapProjectWithSummaryAsync(project.Id, cancellationToken);
    }

    public async Task<ProjectResponse> UpdateAsync(
        string currentUserId,
        Guid projectId,
        UpdateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        ApplyRowVersion(project, request.RowVersion);

        if (await dbContext.Projects.AnyAsync(
                entry => entry.Id != projectId
                    && entry.OrganizationId == project.OrganizationId
                    && entry.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("A project with this name already exists in the organization.");
        }

        var previousName = project.Name;
        var previousDescription = project.Description;

        project.Update(
            request.Name,
            request.Description,
            request.StartDate,
            request.EndDate,
            request.EstimatedCompletionDate);

        await SaveChangesWithConcurrencyAsync(cancellationToken);

        await notificationTriggers.NotifyProjectUpdatedAsync(projectId, currentUserId, cancellationToken);
        await auditTriggers.LogProjectUpdatedAsync(
            projectId,
            currentUserId,
            new { Name = previousName, Description = previousDescription },
            new { request.Name, request.Description },
            cancellationToken);

        logger.LogInformation("Project {ProjectId} updated by user {UserId}", projectId, currentUserId);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task DeleteAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanDeleteProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        project.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Project {ProjectId} deleted by user {UserId}", projectId, currentUserId);
        await auditTriggers.LogProjectDeletedAsync(projectId, currentUserId, cancellationToken);
    }

    public async Task<ProjectResponse> ArchiveAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanDeleteProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        project.Archive();
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Project {ProjectId} archived by user {UserId}", projectId, currentUserId);
        await notificationTriggers.NotifyProjectArchivedAsync(projectId, currentUserId, cancellationToken);
        await auditTriggers.LogProjectArchivedAsync(projectId, currentUserId, cancellationToken);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<ProjectResponse> RestoreAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (!project.IsArchived)
        {
            throw new InvalidOperationException("Only archived projects can be restored.");
        }

        project.Restore();
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Project {ProjectId} restored by user {UserId}", projectId, currentUserId);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<ProjectResponse> TransferOwnershipAsync(
        string currentUserId,
        Guid projectId,
        TransferProjectOwnershipRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanTransferOwnershipAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .Include(entry => entry.Members)
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot be modified.");
        }

        var newOwner = await userManager.FindByIdAsync(request.NewOwnerId)
            ?? throw new InvalidOperationException("New owner not found.");

        await EnsureUserIsActiveAsync(newOwner);
        await organizationAccessService.EnsureCanReadOrganizationAsync(
            request.NewOwnerId,
            project.OrganizationId,
            cancellationToken);

        var previousOwnerId = project.OwnerId;
        project.TransferOwnership(request.NewOwnerId);

        var newOwnerMember = project.Members.SingleOrDefault(member => member.UserId == request.NewOwnerId);
        if (newOwnerMember is null)
        {
            dbContext.ProjectMembers.Add(
                ProjectMember.Create(projectId, request.NewOwnerId, ProjectRole.Owner));
        }
        else
        {
            newOwnerMember.UpdateRole(ProjectRole.Owner);
        }

        var previousOwnerMember = project.Members.SingleOrDefault(member => member.UserId == previousOwnerId);
        if (previousOwnerMember is not null && previousOwnerId != request.NewOwnerId)
        {
            previousOwnerMember.UpdateRole(ProjectRole.Manager);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Project {ProjectId} ownership transferred from {PreviousOwnerId} to {NewOwnerId} by user {UserId}",
            projectId,
            previousOwnerId,
            request.NewOwnerId,
            currentUserId);

        await notificationTriggers.NotifyProjectOwnershipTransferredAsync(
            projectId,
            previousOwnerId,
            request.NewOwnerId,
            currentUserId,
            cancellationToken);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<ProjectResponse> ChangeStatusAsync(
        string currentUserId,
        Guid projectId,
        ChangeProjectStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        project.ChangeStatus(request.Status);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Project {ProjectId} status changed to {Status} by user {UserId}",
            projectId,
            request.Status,
            currentUserId);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<ProjectResponse> ChangePriorityAsync(
        string currentUserId,
        Guid projectId,
        ChangeProjectPriorityRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageProjectAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        project.ChangePriority(request.Priority);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Project {ProjectId} priority changed to {Priority} by user {UserId}",
            projectId,
            request.Priority,
            currentUserId);

        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<ProjectResponse> GetByIdAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadProjectAsync(currentUserId, projectId, cancellationToken);
        return await MapProjectWithSummaryAsync(projectId, cancellationToken);
    }

    public async Task<PagedResult<ProjectResponse>> GetAllAsync(
        string currentUserId,
        ProjectListQuery query,
        CancellationToken cancellationToken = default)
    {
        var projects = await BuildAccessibleProjectsQueryAsync(currentUserId, cancellationToken);

        if (query.OrganizationId.HasValue)
        {
            projects = projects.Where(project => project.OrganizationId == query.OrganizationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            projects = projects.Where(project =>
                project.Name.Contains(search) ||
                project.Code.Contains(search) ||
                (project.Description != null && project.Description.Contains(search)));
        }

        if (query.Status.HasValue)
        {
            projects = projects.Where(project => project.Status == query.Status.Value);
        }

        if (query.Priority.HasValue)
        {
            projects = projects.Where(project => project.Priority == query.Priority.Value);
        }

        if (query.IsArchived.HasValue)
        {
            projects = projects.Where(project => project.IsArchived == query.IsArchived.Value);
        }

        return await ToPagedResultAsync(projects, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    public async Task<PagedResult<ProjectResponse>> SearchAsync(
        string currentUserId,
        ProjectSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        var projects = await BuildAccessibleProjectsQueryAsync(currentUserId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(query.Name))
        {
            var name = query.Name.Trim();
            projects = projects.Where(project => project.Name.Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(query.Code))
        {
            var code = query.Code.Trim().ToUpperInvariant();
            projects = projects.Where(project => project.Code.Contains(code));
        }

        if (query.Status.HasValue)
        {
            projects = projects.Where(project => project.Status == query.Status.Value);
        }

        if (query.Priority.HasValue)
        {
            projects = projects.Where(project => project.Priority == query.Priority.Value);
        }

        if (query.OrganizationId.HasValue)
        {
            projects = projects.Where(project => project.OrganizationId == query.OrganizationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.OwnerId))
        {
            projects = projects.Where(project => project.OwnerId == query.OwnerId);
        }

        if (query.CreatedFrom.HasValue)
        {
            projects = projects.Where(project => project.CreatedAt >= query.CreatedFrom.Value);
        }

        if (query.CreatedTo.HasValue)
        {
            projects = projects.Where(project => project.CreatedAt <= query.CreatedTo.Value);
        }

        if (query.IsArchived.HasValue)
        {
            projects = projects.Where(project => project.IsArchived == query.IsArchived.Value);
        }

        return await ToPagedResultAsync(projects, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    public async Task<ProjectMemberResponse> AddMemberAsync(
        string currentUserId,
        Guid projectId,
        AddProjectMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageMembersAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot be modified.");
        }

        if (await dbContext.ProjectMembers.AnyAsync(
                member => member.ProjectId == projectId && member.UserId == request.UserId,
                cancellationToken))
        {
            throw new InvalidOperationException("User is already a member of this project.");
        }

        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new InvalidOperationException("User not found.");

        await EnsureUserIsActiveAsync(user);
        await organizationAccessService.EnsureCanReadOrganizationAsync(
            request.UserId,
            project.OrganizationId,
            cancellationToken);

        var member = ProjectMember.Create(projectId, request.UserId, request.Role);
        dbContext.ProjectMembers.Add(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} added to project {ProjectId} by user {CurrentUserId}",
            request.UserId,
            projectId,
            currentUserId);

        return MapMember(member, user);
    }

    public async Task RemoveMemberAsync(
        string currentUserId,
        Guid projectId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageMembersAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot be modified.");
        }

        var member = await dbContext.ProjectMembers
            .SingleOrDefaultAsync(entry => entry.ProjectId == projectId && entry.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Project member not found.");

        if (member.Role == ProjectRole.Owner || project.OwnerId == userId)
        {
            var ownerCount = await dbContext.ProjectMembers.CountAsync(
                entry => entry.ProjectId == projectId && entry.Role == ProjectRole.Owner,
                cancellationToken);

            if (ownerCount <= 1)
            {
                throw new InvalidOperationException(
                    "The project owner cannot be removed. Transfer ownership first.");
            }
        }

        dbContext.ProjectMembers.Remove(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} removed from project {ProjectId} by user {CurrentUserId}",
            userId,
            projectId,
            currentUserId);
    }

    public async Task<ProjectMemberResponse> UpdateMemberRoleAsync(
        string currentUserId,
        Guid projectId,
        string userId,
        UpdateProjectMemberRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageMembersAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot be modified.");
        }

        var member = await dbContext.ProjectMembers
            .SingleOrDefaultAsync(entry => entry.ProjectId == projectId && entry.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Project member not found.");

        if ((member.Role == ProjectRole.Owner || project.OwnerId == userId) && request.Role != ProjectRole.Owner)
        {
            var ownerCount = await dbContext.ProjectMembers.CountAsync(
                entry => entry.ProjectId == projectId && entry.Role == ProjectRole.Owner,
                cancellationToken);

            if (ownerCount <= 1)
            {
                throw new InvalidOperationException(
                    "Cannot change the role of the last project owner. Transfer ownership first.");
            }
        }

        member.UpdateRole(request.Role);
        await dbContext.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("User not found.");

        return MapMember(member, user);
    }

    public async Task<IReadOnlyList<ProjectMemberResponse>> GetMembersAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadProjectAsync(currentUserId, projectId, cancellationToken);

        var members = await dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.ProjectId == projectId)
            .OrderByDescending(member => member.Role)
            .ThenBy(member => member.JoinedAt)
            .ToListAsync(cancellationToken);

        var userIds = members.Select(member => member.UserId).ToList();
        var users = await userManager.Users
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        return members
            .Where(member => users.ContainsKey(member.UserId))
            .Select(member => MapMember(member, users[member.UserId]))
            .ToList();
    }

    private async Task<IQueryable<Project>> BuildAccessibleProjectsQueryAsync(
        string currentUserId,
        CancellationToken cancellationToken)
    {
        var projects = dbContext.Projects.AsNoTracking().AsQueryable();

        if (await accessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return projects;
        }

        var adminOrganizationIds = dbContext.OrganizationMembers
            .Where(member =>
                member.UserId == currentUserId
                && (member.Role == OrganizationMemberRole.Owner
                    || member.Role == OrganizationMemberRole.Administrator))
            .Select(member => member.OrganizationId);

        var memberProjectIds = dbContext.ProjectMembers
            .Where(member => member.UserId == currentUserId)
            .Select(member => member.ProjectId);

        return projects.Where(project =>
            adminOrganizationIds.Contains(project.OrganizationId)
            || memberProjectIds.Contains(project.Id));
    }

    private async Task<PagedResult<ProjectResponse>> ToPagedResultAsync(
        IQueryable<Project> projects,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken)
    {
        projects = ApplySorting(projects, sortBy, sortDescending);

        var totalCount = await projects.CountAsync(cancellationToken);
        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var projectIds = await projects
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        var items = new List<ProjectResponse>();
        foreach (var projectId in projectIds)
        {
            items.Add(await MapProjectWithSummaryAsync(projectId, cancellationToken, includeSummary: false));
        }

        return new PagedResult<ProjectResponse>(items, normalizedPage, normalizedPageSize, totalCount);
    }

    private async Task<ProjectResponse> MapProjectWithSummaryAsync(
        Guid projectId,
        CancellationToken cancellationToken,
        bool includeSummary = true)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        ProjectSummary? summary = null;
        if (includeSummary)
        {
            var memberCount = await dbContext.ProjectMembers
                .CountAsync(member => member.ProjectId == projectId, cancellationToken);

            var owner = await userManager.FindByIdAsync(project.OwnerId);
            var organization = await dbContext.Organizations
                .AsNoTracking()
                .SingleAsync(organization => organization.Id == project.OrganizationId, cancellationToken);

            var taskCount = await dbContext.Tasks
                .CountAsync(task => task.ProjectId == projectId, cancellationToken);

            summary = new ProjectSummary(
                memberCount,
                taskCount,
                owner?.Email ?? string.Empty,
                owner is null ? string.Empty : $"{owner.FirstName} {owner.LastName}".Trim(),
                organization.Name);
        }

        return MapProject(project, summary);
    }

    private static ProjectResponse MapProject(Project project, ProjectSummary? summary) =>
        new(
            project.Id,
            project.OrganizationId,
            project.Name,
            project.Code,
            project.Description,
            project.Status,
            project.Priority,
            project.StartDate,
            project.EndDate,
            project.EstimatedCompletionDate,
            project.OwnerId,
            project.IsArchived,
            project.CreatedAt,
            project.UpdatedAt,
            Convert.ToBase64String(project.RowVersion),
            summary);

    private static ProjectMemberResponse MapMember(ProjectMember member, ApplicationUser user) =>
        new(
            member.Id,
            member.ProjectId,
            member.UserId,
            user.Email!,
            user.FirstName,
            user.LastName,
            member.Role,
            member.JoinedAt);

    private static IQueryable<Project> ApplySorting(
        IQueryable<Project> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "code" => sortDescending
                ? query.OrderByDescending(project => project.Code)
                : query.OrderBy(project => project.Code),
            "status" => sortDescending
                ? query.OrderByDescending(project => project.Status)
                : query.OrderBy(project => project.Status),
            "priority" => sortDescending
                ? query.OrderByDescending(project => project.Priority)
                : query.OrderBy(project => project.Priority),
            "createdat" => sortDescending
                ? query.OrderByDescending(project => project.CreatedAt)
                : query.OrderBy(project => project.CreatedAt),
            "startdate" => sortDescending
                ? query.OrderByDescending(project => project.StartDate)
                : query.OrderBy(project => project.StartDate),
            _ => sortDescending
                ? query.OrderByDescending(project => project.Name)
                : query.OrderBy(project => project.Name)
        };

    private void ApplyRowVersion(Project project, string rowVersionBase64)
    {
        try
        {
            var rowVersion = Convert.FromBase64String(rowVersionBase64);
            dbContext.Entry(project).Property(entry => entry.RowVersion).OriginalValue = rowVersion;
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Invalid row version value.");
        }
    }

    private async Task SaveChangesWithConcurrencyAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException(
                "The project was modified by another user. Please refresh and try again.");
        }
    }

    private static async Task EnsureUserIsActiveAsync(ApplicationUser user)
    {
        if (!user.IsActive)
        {
            throw new InvalidOperationException("Inactive users cannot be assigned to projects.");
        }

        await Task.CompletedTask;
    }
}
