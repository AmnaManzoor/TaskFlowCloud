using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Notifications;

public sealed record NotificationResponse(
    Guid Id,
    string UserId,
    NotificationType Type,
    string Title,
    string Message,
    string ReferenceType,
    Guid? ReferenceId,
    bool IsRead,
    DateTimeOffset? ReadAt,
    DateTimeOffset CreatedAt);

public sealed record NotificationCountResponse(int UnreadCount);

public sealed record NotificationListQuery(
    int Page = 1,
    int PageSize = 20,
    bool? IsRead = null,
    NotificationType? Type = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null,
    string? SortBy = "createdAt",
    bool SortDescending = true,
    string? UserId = null);
