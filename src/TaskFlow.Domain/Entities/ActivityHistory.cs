namespace TaskFlow.Domain.Entities;

public sealed class ActivityHistory
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string UserId { get; private set; } = string.Empty;

    public string ActivityType { get; private set; } = string.Empty;

    public string EntityType { get; private set; } = string.Empty;

    public Guid? EntityId { get; private set; }

    public string Description { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }

    private ActivityHistory()
    {
    }

    public static ActivityHistory Create(
        string userId,
        string activityType,
        string entityType,
        Guid? entityId,
        string description)
    {
        return new ActivityHistory
        {
            UserId = userId,
            ActivityType = activityType,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
