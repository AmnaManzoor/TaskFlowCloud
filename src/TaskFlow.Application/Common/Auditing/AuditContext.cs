namespace TaskFlow.Application.Common.Auditing;

public sealed record AuditContext(
    string? UserId = null,
    string? IpAddress = null,
    string? UserAgent = null,
    string? CorrelationId = null);

public interface IAuditContextAccessor
{
    AuditContext Current { get; }

    void Set(AuditContext context);
}
