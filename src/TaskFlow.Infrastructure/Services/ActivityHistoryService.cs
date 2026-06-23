using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class ActivityHistoryService(
    ApplicationDbContext dbContext,
    IAuditAccessService auditAccessService,
    IProjectAccessService projectAccessService,
    ILogger<ActivityHistoryService> logger) : IActivityHistoryService
{
    public async Task<PagedResult<ActivityHistoryResponse>> GetMyActivityAsync(
        string currentUserId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default)
    {
        var activityQuery = dbContext.ActivityHistory
            .AsNoTracking()
            .Where(entry => entry.UserId == currentUserId);

        activityQuery = ApplyFilters(activityQuery, query);

        logger.LogInformation("Activity history retrieved by user {UserId}", currentUserId);

        return await ToPagedResultAsync(activityQuery, query, cancellationToken);
    }

    public async Task<PagedResult<ActivityHistoryResponse>> GetByUserAsync(
        string currentUserId,
        string userId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(currentUserId, userId, StringComparison.Ordinal))
        {
            await auditAccessService.EnsureCanViewUserAuditLogsAsync(currentUserId, userId, cancellationToken);
        }

        var activityQuery = dbContext.ActivityHistory
            .AsNoTracking()
            .Where(entry => entry.UserId == userId);

        activityQuery = ApplyFilters(activityQuery, query);

        logger.LogInformation("Activity history retrieved for user {TargetUserId} by {UserId}", userId, currentUserId);

        return await ToPagedResultAsync(activityQuery, query, cancellationToken);
    }

    public async Task<PagedResult<ActivityHistoryResponse>> GetByProjectAsync(
        string currentUserId,
        Guid projectId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default)
    {
        await projectAccessService.EnsureCanReadProjectAsync(currentUserId, projectId, cancellationToken);

        var taskIds = await dbContext.Tasks
            .AsNoTracking()
            .Where(task => task.ProjectId == projectId)
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);

        var activityQuery = dbContext.ActivityHistory
            .AsNoTracking()
            .Where(entry =>
                (entry.EntityType == AuditEntityTypes.Project && entry.EntityId == projectId)
                || (entry.EntityType == AuditEntityTypes.Task && entry.EntityId.HasValue && taskIds.Contains(entry.EntityId.Value)));

        activityQuery = ApplyFilters(activityQuery, query);

        logger.LogInformation("Project activity history retrieved for project {ProjectId} by user {UserId}", projectId, currentUserId);

        return await ToPagedResultAsync(activityQuery, query, cancellationToken);
    }

    private static IQueryable<ActivityHistory> ApplyFilters(
        IQueryable<ActivityHistory> query,
        ActivityHistoryListQuery listQuery)
    {
        if (!string.IsNullOrWhiteSpace(listQuery.ActivityType))
        {
            query = query.Where(entry => entry.ActivityType == listQuery.ActivityType);
        }

        if (!string.IsNullOrWhiteSpace(listQuery.EntityType))
        {
            query = query.Where(entry => entry.EntityType == listQuery.EntityType);
        }

        if (listQuery.EntityId.HasValue)
        {
            query = query.Where(entry => entry.EntityId == listQuery.EntityId);
        }

        if (listQuery.CreatedFrom.HasValue)
        {
            query = query.Where(entry => entry.CreatedAt >= listQuery.CreatedFrom);
        }

        if (listQuery.CreatedTo.HasValue)
        {
            query = query.Where(entry => entry.CreatedAt <= listQuery.CreatedTo);
        }

        return query;
    }

    private static async Task<PagedResult<ActivityHistoryResponse>> ToPagedResultAsync(
        IQueryable<ActivityHistory> query,
        ActivityHistoryListQuery listQuery,
        CancellationToken cancellationToken)
    {
        query = ApplySorting(query, listQuery.SortBy, listQuery.SortDescending);

        var page = Math.Max(1, listQuery.Page);
        var pageSize = Math.Clamp(listQuery.PageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(entry => MapActivity(entry))
            .ToListAsync(cancellationToken);

        return new PagedResult<ActivityHistoryResponse>(items, page, pageSize, totalCount);
    }

    private static IQueryable<ActivityHistory> ApplySorting(
        IQueryable<ActivityHistory> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "activitytype" => sortDescending
                ? query.OrderByDescending(entry => entry.ActivityType)
                : query.OrderBy(entry => entry.ActivityType),
            "entitytype" => sortDescending
                ? query.OrderByDescending(entry => entry.EntityType)
                : query.OrderBy(entry => entry.EntityType),
            _ => sortDescending
                ? query.OrderByDescending(entry => entry.CreatedAt)
                : query.OrderBy(entry => entry.CreatedAt)
        };

    private static ActivityHistoryResponse MapActivity(ActivityHistory entry) =>
        new(
            entry.Id,
            entry.UserId,
            entry.ActivityType,
            entry.EntityType,
            entry.EntityId,
            entry.Description,
            entry.CreatedAt);
}
