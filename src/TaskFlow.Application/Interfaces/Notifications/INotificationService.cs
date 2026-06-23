using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Interfaces.Notifications;

public interface INotificationPublisher
{
    Task PublishAsync(
        string userId,
        NotificationType type,
        string title,
        string message,
        string referenceType,
        Guid? referenceId,
        CancellationToken cancellationToken = default);

    Task PublishToManyAsync(
        IEnumerable<string> userIds,
        NotificationType type,
        string title,
        string message,
        string referenceType,
        Guid? referenceId,
        string? excludeUserId = null,
        CancellationToken cancellationToken = default);
}

public interface INotificationService
{
    Task<NotificationResponse> GetByIdAsync(
        string currentUserId,
        Guid notificationId,
        bool allowAdminAccess = false,
        CancellationToken cancellationToken = default);

    Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(
        string currentUserId,
        NotificationListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<NotificationResponse>> GetUnreadAsync(
        string currentUserId,
        NotificationListQuery query,
        CancellationToken cancellationToken = default);

    Task<NotificationCountResponse> GetUnreadCountAsync(
        string currentUserId,
        CancellationToken cancellationToken = default);

    Task<NotificationResponse> MarkAsReadAsync(
        string currentUserId,
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task<NotificationResponse> MarkAsUnreadAsync(
        string currentUserId,
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(string currentUserId, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid notificationId, CancellationToken cancellationToken = default);

    Task<int> DeleteAllReadAsync(string currentUserId, CancellationToken cancellationToken = default);
}
