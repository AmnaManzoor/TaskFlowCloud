using TaskFlow.Application.Common.Auditing;

namespace TaskFlow.Infrastructure.Auditing;

public sealed class AuditContextAccessor : IAuditContextAccessor
{
    public AuditContext Current { get; private set; } = new();

    public void Set(AuditContext context) => Current = context;
}
