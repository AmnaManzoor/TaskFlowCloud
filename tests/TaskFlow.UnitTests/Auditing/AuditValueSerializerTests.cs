using TaskFlow.Infrastructure.Auditing;

namespace TaskFlow.UnitTests.Auditing;

public class AuditValueSerializerTests
{
    [Fact]
    public void Serialize_IgnoresInsignificantProperties()
    {
        var json = AuditValueSerializer.Serialize(new
        {
            Title = "Task",
            LastViewedAt = DateTimeOffset.UtcNow,
            RowVersion = new byte[] { 1, 2, 3 }
        });

        Assert.NotNull(json);
        Assert.Contains("title", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("lastViewedAt", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("rowVersion", json, StringComparison.OrdinalIgnoreCase);
    }
}
