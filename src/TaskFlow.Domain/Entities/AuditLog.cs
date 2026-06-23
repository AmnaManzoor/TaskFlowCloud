namespace TaskFlow.Domain.Entities;

public sealed class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string? UserId { get; private set; }

    public string Action { get; private set; } = string.Empty;

    public string EntityType { get; private set; } = string.Empty;

    public Guid? EntityId { get; private set; }

    public string Description { get; private set; } = string.Empty;

    public string? OldValues { get; private set; }

    public string? NewValues { get; private set; }

    public string? IPAddress { get; private set; }

    public string? UserAgent { get; private set; }

    public string? CorrelationId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    private AuditLog()
    {
    }

    public static AuditLog Create(
        string? userId,
        string action,
        string entityType,
        Guid? entityId,
        string description,
        string? oldValues,
        string? newValues,
        string? ipAddress,
        string? userAgent,
        string? correlationId)
    {
        return new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            OldValues = oldValues,
            NewValues = newValues,
            IPAddress = ipAddress,
            UserAgent = userAgent,
            CorrelationId = correlationId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
