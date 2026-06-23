using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.Interfaces.Notifications;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class NotificationService(
    ApplicationDbContext dbContext,
    IOrganizationAccessService organizationAccessService,
    IAuditTriggerService auditTriggers,
    ILogger<NotificationService> logger) : INotificationService
{
    public async Task<NotificationResponse> GetByIdAsync(
        string currentUserId,
        Guid notificationId,
        bool allowAdminAccess = false,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == notificationId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        await EnsureCanAccessAsync(currentUserId, notification.UserId, allowAdminAccess, cancellationToken);
        return MapNotification(notification);
    }

    public async Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(
        string currentUserId,
        NotificationListQuery query,
        CancellationToken cancellationToken = default)
    {
        var targetUserId = await ResolveTargetUserIdAsync(currentUserId, query.UserId, cancellationToken);
        var notifications = ApplyFilters(dbContext.Notifications.AsNoTracking().Where(n => n.UserId == targetUserId), query);
        return await ToPagedResultAsync(notifications, query, cancellationToken);
    }

    public async Task<PagedResult<NotificationResponse>> GetUnreadAsync(
        string currentUserId,
        NotificationListQuery query,
        CancellationToken cancellationToken = default)
    {
        var unreadQuery = query with { IsRead = false };
        return await GetMyNotificationsAsync(currentUserId, unreadQuery, cancellationToken);
    }

    public async Task<NotificationCountResponse> GetUnreadCountAsync(
        string currentUserId,
        CancellationToken cancellationToken = default)
    {
        var count = await dbContext.Notifications
            .AsNoTracking()
            .CountAsync(notification => notification.UserId == currentUserId && !notification.IsRead, cancellationToken);

        return new NotificationCountResponse(count);
    }

    public async Task<NotificationResponse> MarkAsReadAsync(
        string currentUserId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .SingleOrDefaultAsync(entry => entry.Id == notificationId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        await EnsureCanAccessAsync(currentUserId, notification.UserId, allowAdminAccess: false, cancellationToken);

        notification.MarkAsRead();
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}", notificationId, currentUserId);
        await auditTriggers.LogNotificationReadAsync(notificationId, currentUserId, cancellationToken);

        return MapNotification(notification);
    }

    public async Task<NotificationResponse> MarkAsUnreadAsync(
        string currentUserId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .SingleOrDefaultAsync(entry => entry.Id == notificationId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        await EnsureCanAccessAsync(currentUserId, notification.UserId, allowAdminAccess: false, cancellationToken);

        notification.MarkAsUnread();
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Notification {NotificationId} marked as unread by user {UserId}", notificationId, currentUserId);

        return MapNotification(notification);
    }

    public async Task<int> MarkAllAsReadAsync(string currentUserId, CancellationToken cancellationToken = default)
    {
        var unread = await dbContext.Notifications
            .Where(notification => notification.UserId == currentUserId && !notification.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in unread)
        {
            notification.MarkAsRead();
        }

        if (unread.Count == 0)
        {
            return 0;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Bulk read: {Count} notifications marked as read for user {UserId}", unread.Count, currentUserId);
        return unread.Count;
    }

    public async Task DeleteAsync(
        string currentUserId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .SingleOrDefaultAsync(entry => entry.Id == notificationId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        await EnsureCanAccessAsync(currentUserId, notification.UserId, allowAdminAccess: false, cancellationToken);

        dbContext.Notifications.Remove(notification);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Notification {NotificationId} deleted by user {UserId}", notificationId, currentUserId);
        await auditTriggers.LogNotificationDeletedAsync(notificationId, currentUserId, cancellationToken);
    }

    public async Task<int> DeleteAllReadAsync(string currentUserId, CancellationToken cancellationToken = default)
    {
        var readNotifications = await dbContext.Notifications
            .Where(notification => notification.UserId == currentUserId && notification.IsRead)
            .ToListAsync(cancellationToken);

        if (readNotifications.Count == 0)
        {
            return 0;
        }

        dbContext.Notifications.RemoveRange(readNotifications);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Bulk delete: {Count} read notifications deleted for user {UserId}", readNotifications.Count, currentUserId);
        return readNotifications.Count;
    }

    private async Task<PagedResult<NotificationResponse>> ToPagedResultAsync(
        IQueryable<Notification> notifications,
        NotificationListQuery query,
        CancellationToken cancellationToken)
    {
        notifications = ApplySorting(notifications, query.SortBy, query.SortDescending);

        var totalCount = await notifications.CountAsync(cancellationToken);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await notifications
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(notification => MapNotification(notification))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationResponse>(items, page, pageSize, totalCount);
    }

    private static IQueryable<Notification> ApplyFilters(
        IQueryable<Notification> notifications,
        NotificationListQuery query)
    {
        if (query.IsRead.HasValue)
        {
            notifications = notifications.Where(notification => notification.IsRead == query.IsRead.Value);
        }

        if (query.Type.HasValue)
        {
            notifications = notifications.Where(notification => notification.Type == query.Type.Value);
        }

        if (query.CreatedFrom.HasValue)
        {
            notifications = notifications.Where(notification => notification.CreatedAt >= query.CreatedFrom.Value);
        }

        if (query.CreatedTo.HasValue)
        {
            notifications = notifications.Where(notification => notification.CreatedAt <= query.CreatedTo.Value);
        }

        return notifications;
    }

    private static IQueryable<Notification> ApplySorting(
        IQueryable<Notification> query,
        string? sortBy,
        bool sortDescending)
    {
        var unreadFirst = query.OrderBy(notification => notification.IsRead);

        return (sortBy?.ToLowerInvariant()) switch
        {
            "type" => sortDescending
                ? unreadFirst.ThenByDescending(notification => notification.Type)
                : unreadFirst.ThenBy(notification => notification.Type),
            "createdat" => sortDescending
                ? unreadFirst.ThenByDescending(notification => notification.CreatedAt)
                : unreadFirst.ThenBy(notification => notification.CreatedAt),
            _ => unreadFirst.ThenByDescending(notification => notification.CreatedAt)
        };
    }

    private async Task EnsureCanAccessAsync(
        string currentUserId,
        string ownerUserId,
        bool allowAdminAccess,
        CancellationToken cancellationToken)
    {
        if (string.Equals(currentUserId, ownerUserId, StringComparison.Ordinal))
        {
            return;
        }

        if (allowAdminAccess && await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return;
        }

        logger.LogWarning(
            "Unauthorized notification access attempt by user {UserId} for notification owned by {OwnerUserId}",
            currentUserId,
            ownerUserId);

        throw new UnauthorizedAccessException("You do not have access to this notification.");
    }

    private async Task<string> ResolveTargetUserIdAsync(
        string currentUserId,
        string? requestedUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestedUserId) || requestedUserId == currentUserId)
        {
            return currentUserId;
        }

        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return requestedUserId;
        }

        throw new UnauthorizedAccessException("You do not have permission to view notifications for another user.");
    }

    private static NotificationResponse MapNotification(Notification notification) =>
        new(
            notification.Id,
            notification.UserId,
            notification.Type,
            notification.Title,
            notification.Message,
            notification.ReferenceType,
            notification.ReferenceId,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt);
}
