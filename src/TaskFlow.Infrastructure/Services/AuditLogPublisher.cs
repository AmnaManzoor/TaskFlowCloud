using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Auditing;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Auditing;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class AuditLogPublisher(
    ApplicationDbContext dbContext,
    IAuditContextAccessor auditContextAccessor,
    ILogger<AuditLogPublisher> logger) : IAuditLogPublisher
{
    public async Task RecordAsync(
        string? userId,
        string action,
        string entityType,
        Guid? entityId,
        string description,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken cancellationToken = default)
    {
        var context = auditContextAccessor.Current;
        var auditLog = AuditLog.Create(
            userId ?? context.UserId,
            action,
            entityType,
            entityId,
            description,
            AuditValueSerializer.Serialize(oldValues),
            AuditValueSerializer.Serialize(newValues),
            context.IpAddress,
            context.UserAgent,
            context.CorrelationId);

        dbContext.AuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Audit log {AuditLogId} created: action {Action}, entity {EntityType}/{EntityId}, user {UserId}",
            auditLog.Id,
            action,
            entityType,
            entityId,
            userId);
    }
}
