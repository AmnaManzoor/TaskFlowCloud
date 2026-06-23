using TaskFlow.Application.Common.Models;

namespace TaskFlow.Application.DTOs.Audit;

public sealed record AuditLogResponse(
    Guid Id,
    string? UserId,
    string Action,
    string EntityType,
    Guid? EntityId,
    string Description,
    string? OldValues,
    string? NewValues,
    string? IPAddress,
    string? UserAgent,
    string? CorrelationId,
    DateTimeOffset CreatedAt);

public sealed record ActivityHistoryResponse(
    Guid Id,
    string UserId,
    string ActivityType,
    string EntityType,
    Guid? EntityId,
    string Description,
    DateTimeOffset CreatedAt);

public sealed record AuditLogListQuery(
    int Page = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = true,
    string? Action = null,
    string? EntityType = null,
    Guid? EntityId = null,
    string? UserId = null,
    string? CorrelationId = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null,
    Guid? OrganizationId = null);

public sealed record ActivityHistoryListQuery(
    int Page = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = true,
    string? ActivityType = null,
    string? EntityType = null,
    Guid? EntityId = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null);
