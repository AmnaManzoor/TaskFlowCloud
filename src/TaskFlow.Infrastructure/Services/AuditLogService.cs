using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class AuditLogService(
    ApplicationDbContext dbContext,
    IAuditAccessService auditAccessService,
    ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task<AuditLogResponse> GetByIdAsync(
        string currentUserId,
        Guid auditLogId,
        CancellationToken cancellationToken = default)
    {
        await auditAccessService.EnsureCanViewAuditLogsAsync(currentUserId, cancellationToken);

        var auditLog = await dbContext.AuditLogs
            .AsNoTracking()
            .Where(entry => entry.Id == auditLogId)
            .Select(entry => MapAuditLog(entry))
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Audit log not found.");

        await EnsureCanViewAuditEntryAsync(currentUserId, auditLog, cancellationToken);

        logger.LogInformation("Audit log {AuditLogId} read by user {UserId}", auditLogId, currentUserId);

        return auditLog;
    }

    public async Task<PagedResult<AuditLogResponse>> SearchAsync(
        string currentUserId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default)
    {
        await auditAccessService.EnsureCanViewAuditLogsAsync(currentUserId, cancellationToken);

        var auditQuery = dbContext.AuditLogs.AsNoTracking();
        auditQuery = await ApplyAccessScopeAsync(currentUserId, auditQuery, query.OrganizationId, cancellationToken);
        auditQuery = ApplyFilters(auditQuery, query);

        logger.LogInformation("Audit log search executed by user {UserId}", currentUserId);

        return await ToPagedResultAsync(auditQuery, query, cancellationToken);
    }

    public async Task<PagedResult<AuditLogResponse>> GetByEntityAsync(
        string currentUserId,
        string entityType,
        Guid entityId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default)
    {
        await auditAccessService.EnsureCanViewEntityAuditLogsAsync(currentUserId, entityType, entityId, cancellationToken);

        var auditQuery = dbContext.AuditLogs
            .AsNoTracking()
            .Where(entry => entry.EntityType == entityType && entry.EntityId == entityId);

        auditQuery = ApplyFilters(auditQuery, query with { EntityType = entityType, EntityId = entityId });

        logger.LogInformation(
            "Audit log entity search executed by user {UserId} for {EntityType}/{EntityId}",
            currentUserId,
            entityType,
            entityId);

        return await ToPagedResultAsync(auditQuery, query, cancellationToken);
    }

    public async Task<PagedResult<AuditLogResponse>> GetByUserAsync(
        string currentUserId,
        string userId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default)
    {
        await auditAccessService.EnsureCanViewUserAuditLogsAsync(currentUserId, userId, cancellationToken);

        if (!await auditAccessService.IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            await auditAccessService.EnsureCanViewAuditLogsAsync(currentUserId, cancellationToken);
        }

        var auditQuery = dbContext.AuditLogs
            .AsNoTracking()
            .Where(entry => entry.UserId == userId);

        auditQuery = ApplyFilters(auditQuery, query with { UserId = userId });

        logger.LogInformation("Audit log user search executed by user {UserId} for target {TargetUserId}", currentUserId, userId);

        return await ToPagedResultAsync(auditQuery, query, cancellationToken);
    }

    private async Task EnsureCanViewAuditEntryAsync(
        string currentUserId,
        AuditLogResponse auditLog,
        CancellationToken cancellationToken)
    {
        if (await auditAccessService.IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            return;
        }

        if (auditLog.EntityId.HasValue)
        {
            await auditAccessService.EnsureCanViewEntityAuditLogsAsync(
                currentUserId,
                auditLog.EntityType,
                auditLog.EntityId.Value,
                cancellationToken);
        }
    }

    private async Task<IQueryable<AuditLog>> ApplyAccessScopeAsync(
        string currentUserId,
        IQueryable<AuditLog> query,
        Guid? organizationId,
        CancellationToken cancellationToken)
    {
        if (await auditAccessService.IsAuditAdministratorAsync(currentUserId, cancellationToken))
        {
            return organizationId.HasValue
                ? await FilterByOrganizationAsync(query, organizationId.Value, cancellationToken)
                : query;
        }

        var ownedOrganizationIds = await dbContext.OrganizationMembers
            .AsNoTracking()
            .Where(member => member.UserId == currentUserId && member.Role == OrganizationMemberRole.Owner)
            .Select(member => member.OrganizationId)
            .ToListAsync(cancellationToken);

        if (organizationId.HasValue)
        {
            if (!ownedOrganizationIds.Contains(organizationId.Value))
            {
                logger.LogWarning(
                    "Unauthorized audit access attempt by user {UserId} for organization {OrganizationId}",
                    currentUserId,
                    organizationId);

                throw new UnauthorizedAccessException("You do not have permission to view audit logs for this organization.");
            }

            return await FilterByOrganizationAsync(query, organizationId.Value, cancellationToken);
        }

        return await FilterByOrganizationsAsync(query, ownedOrganizationIds, cancellationToken);
    }

    private async Task<IQueryable<AuditLog>> FilterByOrganizationAsync(
        IQueryable<AuditLog> query,
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var projectIds = await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.OrganizationId == organizationId)
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        var taskIds = await dbContext.Tasks
            .AsNoTracking()
            .Where(task => projectIds.Contains(task.ProjectId))
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);

        var teamIds = await dbContext.Teams
            .AsNoTracking()
            .Where(team => team.OrganizationId == organizationId)
            .Select(team => team.Id)
            .ToListAsync(cancellationToken);

        return query.Where(entry =>
            (entry.EntityType == AuditEntityTypes.Organization && entry.EntityId == organizationId)
            || (entry.EntityType == AuditEntityTypes.Project && entry.EntityId.HasValue && projectIds.Contains(entry.EntityId.Value))
            || (entry.EntityType == AuditEntityTypes.Task && entry.EntityId.HasValue && taskIds.Contains(entry.EntityId.Value))
            || (entry.EntityType == AuditEntityTypes.Team && entry.EntityId.HasValue && teamIds.Contains(entry.EntityId.Value)));
    }

    private async Task<IQueryable<AuditLog>> FilterByOrganizationsAsync(
        IQueryable<AuditLog> query,
        IReadOnlyList<Guid> organizationIds,
        CancellationToken cancellationToken)
    {
        if (organizationIds.Count == 0)
        {
            return query.Where(_ => false);
        }

        var projectIds = await dbContext.Projects
            .AsNoTracking()
            .Where(project => organizationIds.Contains(project.OrganizationId))
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        var taskIds = await dbContext.Tasks
            .AsNoTracking()
            .Where(task => projectIds.Contains(task.ProjectId))
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);

        var teamIds = await dbContext.Teams
            .AsNoTracking()
            .Where(team => organizationIds.Contains(team.OrganizationId))
            .Select(team => team.Id)
            .ToListAsync(cancellationToken);

        return query.Where(entry =>
            (entry.EntityType == AuditEntityTypes.Organization && entry.EntityId.HasValue && organizationIds.Contains(entry.EntityId.Value))
            || (entry.EntityType == AuditEntityTypes.Project && entry.EntityId.HasValue && projectIds.Contains(entry.EntityId.Value))
            || (entry.EntityType == AuditEntityTypes.Task && entry.EntityId.HasValue && taskIds.Contains(entry.EntityId.Value))
            || (entry.EntityType == AuditEntityTypes.Team && entry.EntityId.HasValue && teamIds.Contains(entry.EntityId.Value)));
    }

    private static IQueryable<AuditLog> ApplyFilters(IQueryable<AuditLog> query, AuditLogListQuery listQuery)
    {
        if (!string.IsNullOrWhiteSpace(listQuery.Action))
        {
            query = query.Where(entry => entry.Action == listQuery.Action);
        }

        if (!string.IsNullOrWhiteSpace(listQuery.EntityType))
        {
            query = query.Where(entry => entry.EntityType == listQuery.EntityType);
        }

        if (listQuery.EntityId.HasValue)
        {
            query = query.Where(entry => entry.EntityId == listQuery.EntityId);
        }

        if (!string.IsNullOrWhiteSpace(listQuery.UserId))
        {
            query = query.Where(entry => entry.UserId == listQuery.UserId);
        }

        if (!string.IsNullOrWhiteSpace(listQuery.CorrelationId))
        {
            query = query.Where(entry => entry.CorrelationId == listQuery.CorrelationId);
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

    private static async Task<PagedResult<AuditLogResponse>> ToPagedResultAsync(
        IQueryable<AuditLog> query,
        AuditLogListQuery listQuery,
        CancellationToken cancellationToken)
    {
        query = ApplySorting(query, listQuery.SortBy, listQuery.SortDescending);

        var page = Math.Max(1, listQuery.Page);
        var pageSize = Math.Clamp(listQuery.PageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(entry => MapAuditLog(entry))
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditLogResponse>(items, page, pageSize, totalCount);
    }

    private static IQueryable<AuditLog> ApplySorting(
        IQueryable<AuditLog> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "action" => sortDescending
                ? query.OrderByDescending(entry => entry.Action)
                : query.OrderBy(entry => entry.Action),
            "entitytype" => sortDescending
                ? query.OrderByDescending(entry => entry.EntityType)
                : query.OrderBy(entry => entry.EntityType),
            "userid" => sortDescending
                ? query.OrderByDescending(entry => entry.UserId)
                : query.OrderBy(entry => entry.UserId),
            _ => sortDescending
                ? query.OrderByDescending(entry => entry.CreatedAt)
                : query.OrderBy(entry => entry.CreatedAt)
        };

    private static AuditLogResponse MapAuditLog(AuditLog entry) =>
        new(
            entry.Id,
            entry.UserId,
            entry.Action,
            entry.EntityType,
            entry.EntityId,
            entry.Description,
            entry.OldValues,
            entry.NewValues,
            entry.IPAddress,
            entry.UserAgent,
            entry.CorrelationId,
            entry.CreatedAt);
}
