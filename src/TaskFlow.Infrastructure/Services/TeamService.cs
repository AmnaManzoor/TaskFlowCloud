using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Teams;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class TeamService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOrganizationAccessService accessService,
    INotificationTriggerService notificationTriggers,
    IAuditTriggerService auditTriggers,
    ILogger<TeamService> logger) : ITeamService
{
    public async Task<TeamResponse> CreateAsync(
        string currentUserId,
        CreateTeamRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTeamsAsync(currentUserId, request.OrganizationId, cancellationToken);

        if (await dbContext.Teams.AnyAsync(
                team => team.OrganizationId == request.OrganizationId && team.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("A team with this name already exists in the organization.");
        }

        var team = Team.Create(request.OrganizationId, request.Name, request.Description);
        dbContext.Teams.Add(team);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Team {TeamId} created in organization {OrganizationId} by user {UserId}",
            team.Id,
            request.OrganizationId,
            currentUserId);

        await auditTriggers.LogTeamCreatedAsync(team.Id, currentUserId, cancellationToken);

        return MapTeam(team);
    }

    public async Task<TeamResponse> UpdateAsync(
        string currentUserId,
        Guid teamId,
        UpdateTeamRequest request,
        CancellationToken cancellationToken = default)
    {
        var team = await GetTeamOrThrowAsync(teamId, cancellationToken);
        await accessService.EnsureCanManageTeamsAsync(currentUserId, team.OrganizationId, cancellationToken);

        if (await dbContext.Teams.AnyAsync(
                entry => entry.Id != teamId &&
                         entry.OrganizationId == team.OrganizationId &&
                         entry.Name == request.Name,
                cancellationToken))
        {
            throw new InvalidOperationException("A team with this name already exists in the organization.");
        }

        team.Update(request.Name, request.Description);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Team {TeamId} updated by user {UserId}", teamId, currentUserId);

        return MapTeam(team);
    }

    public async Task DeleteAsync(
        string currentUserId,
        Guid teamId,
        CancellationToken cancellationToken = default)
    {
        var team = await GetTeamOrThrowAsync(teamId, cancellationToken);
        await accessService.EnsureCanManageTeamsAsync(currentUserId, team.OrganizationId, cancellationToken);

        team.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Team {TeamId} deleted by user {UserId}", teamId, currentUserId);
    }

    public async Task<TeamResponse> GetByIdAsync(
        string currentUserId,
        Guid teamId,
        CancellationToken cancellationToken = default)
    {
        var team = await dbContext.Teams
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == teamId, cancellationToken)
            ?? throw new KeyNotFoundException("Team not found.");

        await accessService.EnsureCanReadOrganizationAsync(currentUserId, team.OrganizationId, cancellationToken);

        return MapTeam(team);
    }

    public async Task<PagedResult<TeamResponse>> GetAllAsync(
        string currentUserId,
        TeamListQuery query,
        CancellationToken cancellationToken = default)
    {
        var teams = dbContext.Teams.AsNoTracking().AsQueryable();

        if (query.OrganizationId.HasValue)
        {
            await accessService.EnsureCanReadOrganizationAsync(
                currentUserId,
                query.OrganizationId.Value,
                cancellationToken);

            teams = teams.Where(team => team.OrganizationId == query.OrganizationId.Value);
        }
        else if (!await accessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            var organizationIds = dbContext.OrganizationMembers
                .Where(member => member.UserId == currentUserId)
                .Select(member => member.OrganizationId);

            teams = teams.Where(team => organizationIds.Contains(team.OrganizationId));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            teams = teams.Where(team =>
                team.Name.Contains(search) ||
                (team.Description != null && team.Description.Contains(search)));
        }

        teams = ApplySorting(teams, query.SortBy, query.SortDescending);

        var totalCount = await teams.CountAsync(cancellationToken);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await teams
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(team => MapTeam(team))
            .ToListAsync(cancellationToken);

        return new PagedResult<TeamResponse>(items, page, pageSize, totalCount);
    }

    public async Task<TeamMemberResponse> AddMemberAsync(
        string currentUserId,
        Guid teamId,
        AddTeamMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        var team = await GetTeamOrThrowAsync(teamId, cancellationToken);
        await accessService.EnsureCanManageTeamsAsync(currentUserId, team.OrganizationId, cancellationToken);

        var user = await userManager.FindByIdAsync(request.UserId)
            ?? throw new InvalidOperationException("User not found.");

        if (!user.IsActive)
        {
            throw new InvalidOperationException("Inactive users cannot be assigned to organizations or teams.");
        }

        var isOrganizationMember = await dbContext.OrganizationMembers.AnyAsync(
            member => member.OrganizationId == team.OrganizationId && member.UserId == request.UserId,
            cancellationToken);

        if (!isOrganizationMember)
        {
            throw new InvalidOperationException("User must be an organization member before joining a team.");
        }

        if (await dbContext.TeamMembers.AnyAsync(
                member => member.TeamId == teamId && member.UserId == request.UserId,
                cancellationToken))
        {
            throw new InvalidOperationException("User is already a member of this team.");
        }

        var member = TeamMember.Create(teamId, request.UserId);
        dbContext.TeamMembers.Add(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} added to team {TeamId} by user {CurrentUserId}",
            request.UserId,
            teamId,
            currentUserId);

        await notificationTriggers.NotifyTeamMemberAddedAsync(teamId, request.UserId, cancellationToken);
        await auditTriggers.LogMemberAddedAsync(
            AuditEntityTypes.TeamMember,
            teamId,
            request.UserId,
            currentUserId,
            cancellationToken);

        return MapMember(member, user);
    }

    public async Task RemoveMemberAsync(
        string currentUserId,
        Guid teamId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var team = await GetTeamOrThrowAsync(teamId, cancellationToken);
        await accessService.EnsureCanManageTeamsAsync(currentUserId, team.OrganizationId, cancellationToken);

        var member = await dbContext.TeamMembers
            .SingleOrDefaultAsync(entry => entry.TeamId == teamId && entry.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Team member not found.");

        dbContext.TeamMembers.Remove(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Member {UserId} removed from team {TeamId} by user {CurrentUserId}",
            userId,
            teamId,
            currentUserId);
    }

    public async Task<IReadOnlyList<TeamMemberResponse>> GetMembersAsync(
        string currentUserId,
        Guid teamId,
        CancellationToken cancellationToken = default)
    {
        var team = await dbContext.Teams
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == teamId, cancellationToken)
            ?? throw new KeyNotFoundException("Team not found.");

        await accessService.EnsureCanReadOrganizationAsync(currentUserId, team.OrganizationId, cancellationToken);

        var members = await dbContext.TeamMembers
            .AsNoTracking()
            .Where(member => member.TeamId == teamId)
            .ToListAsync(cancellationToken);

        var userIds = members.Select(member => member.UserId).ToList();
        var users = await userManager.Users
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        return members
            .Select(member => MapMember(member, users[member.UserId]))
            .ToList();
    }

    private async Task<Team> GetTeamOrThrowAsync(Guid teamId, CancellationToken cancellationToken) =>
        await dbContext.Teams.SingleOrDefaultAsync(team => team.Id == teamId, cancellationToken)
        ?? throw new KeyNotFoundException("Team not found.");

    private static IQueryable<Team> ApplySorting(IQueryable<Team> query, string? sortBy, bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "createdat" => sortDescending
                ? query.OrderByDescending(team => team.CreatedAt)
                : query.OrderBy(team => team.CreatedAt),
            _ => sortDescending
                ? query.OrderByDescending(team => team.Name)
                : query.OrderBy(team => team.Name)
        };

    private static TeamResponse MapTeam(Team team) =>
        new(team.Id, team.OrganizationId, team.Name, team.Description, team.CreatedAt, team.UpdatedAt);

    private static TeamMemberResponse MapMember(TeamMember member, ApplicationUser user) =>
        new(member.Id, member.TeamId, member.UserId, user.Email!, user.FirstName, user.LastName, member.JoinedAt);
}
