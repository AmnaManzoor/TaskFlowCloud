using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;

namespace TaskFlow.UnitTests.Domain;

public class AuditLogTests
{
    [Fact]
    public void Create_SetsImmutableProperties()
    {
        var auditLog = AuditLog.Create(
            "user-id",
            AuditActions.TaskCreated,
            AuditEntityTypes.Task,
            Guid.NewGuid(),
            "Task created.",
            null,
            "{\"title\":\"New task\"}",
            "127.0.0.1",
            "TestAgent",
            "correlation-id");

        Assert.Equal("user-id", auditLog.UserId);
        Assert.Equal(AuditActions.TaskCreated, auditLog.Action);
        Assert.Equal(AuditEntityTypes.Task, auditLog.EntityType);
        Assert.Equal("127.0.0.1", auditLog.IPAddress);
        Assert.NotEqual(default, auditLog.CreatedAt);
    }
}
