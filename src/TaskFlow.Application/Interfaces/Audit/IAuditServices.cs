using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Audit;

namespace TaskFlow.Application.Interfaces.Audit;

public interface IAuditLogPublisher
{
    Task RecordAsync(
        string? userId,
        string action,
        string entityType,
        Guid? entityId,
        string description,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken cancellationToken = default);
}

public interface IActivityRecorder
{
    Task RecordAsync(
        string userId,
        string activityType,
        string entityType,
        Guid? entityId,
        string description,
        CancellationToken cancellationToken = default);
}

public interface IAuditAccessService
{
    Task EnsureCanViewAuditLogsAsync(string currentUserId, CancellationToken cancellationToken = default);

    Task EnsureCanViewUserAuditLogsAsync(
        string currentUserId,
        string targetUserId,
        CancellationToken cancellationToken = default);

    Task EnsureCanViewEntityAuditLogsAsync(
        string currentUserId,
        string entityType,
        Guid entityId,
        CancellationToken cancellationToken = default);

    Task<bool> IsAuditAdministratorAsync(string currentUserId, CancellationToken cancellationToken = default);

    Task<bool> IsOrganizationOwnerAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default);
}

public interface IAuditLogService
{
    Task<AuditLogResponse> GetByIdAsync(
        string currentUserId,
        Guid auditLogId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<AuditLogResponse>> SearchAsync(
        string currentUserId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<AuditLogResponse>> GetByEntityAsync(
        string currentUserId,
        string entityType,
        Guid entityId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<AuditLogResponse>> GetByUserAsync(
        string currentUserId,
        string userId,
        AuditLogListQuery query,
        CancellationToken cancellationToken = default);
}

public interface IActivityHistoryService
{
    Task<PagedResult<ActivityHistoryResponse>> GetMyActivityAsync(
        string currentUserId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ActivityHistoryResponse>> GetByUserAsync(
        string currentUserId,
        string userId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ActivityHistoryResponse>> GetByProjectAsync(
        string currentUserId,
        Guid projectId,
        ActivityHistoryListQuery query,
        CancellationToken cancellationToken = default);
}
