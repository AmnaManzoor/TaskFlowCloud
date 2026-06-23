using Microsoft.Extensions.Logging;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class ActivityRecorder(
    ApplicationDbContext dbContext,
    ILogger<ActivityRecorder> logger) : IActivityRecorder
{
    public async Task RecordAsync(
        string userId,
        string activityType,
        string entityType,
        Guid? entityId,
        string description,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var activity = ActivityHistory.Create(userId, activityType, entityType, entityId, description);
        dbContext.ActivityHistory.Add(activity);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Activity recorded {ActivityId}: type {ActivityType}, entity {EntityType}/{EntityId}, user {UserId}",
            activity.Id,
            activityType,
            entityType,
            entityId,
            userId);
    }
}
