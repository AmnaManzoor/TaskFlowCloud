using Microsoft.Extensions.Logging;
using TaskFlow.Application.Interfaces.Notifications;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class NotificationPublisher(
    ApplicationDbContext dbContext,
    ILogger<NotificationPublisher> logger) : INotificationPublisher
{
    public async Task PublishAsync(
        string userId,
        NotificationType type,
        string title,
        string message,
        string referenceType,
        Guid? referenceId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        var notification = Notification.Create(userId, type, title, message, referenceType, referenceId);
        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Notification {NotificationId} created for user {UserId} with type {Type}",
            notification.Id,
            userId,
            type);
    }

    public async Task PublishToManyAsync(
        IEnumerable<string> userIds,
        NotificationType type,
        string title,
        string message,
        string referenceType,
        Guid? referenceId,
        string? excludeUserId = null,
        CancellationToken cancellationToken = default)
    {
        var recipients = userIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .Where(id => excludeUserId is null || !string.Equals(id, excludeUserId, StringComparison.Ordinal));

        var created = false;
        foreach (var userId in recipients)
        {
            dbContext.Notifications.Add(
                Notification.Create(userId, type, title, message, referenceType, referenceId));
            created = true;
        }

        if (!created)
        {
            return;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Bulk notification type {Type} created for {Count} users",
            type,
            recipients.Count());
    }
}
