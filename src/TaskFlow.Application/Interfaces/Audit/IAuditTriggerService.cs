using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Interfaces.Audit;

public interface IAuditTriggerService
{
    Task LogUserRegisteredAsync(string userId, CancellationToken cancellationToken = default);

    Task LogUserLoggedInAsync(string userId, CancellationToken cancellationToken = default);

    Task LogUserLoggedOutAsync(string userId, CancellationToken cancellationToken = default);

    Task LogPasswordChangedAsync(string userId, CancellationToken cancellationToken = default);

    Task LogProfileUpdatedAsync(string userId, object? oldValues, object? newValues, CancellationToken cancellationToken = default);

    Task LogAuthorizationFailedAsync(string? userId, string description, CancellationToken cancellationToken = default);

    Task LogOrganizationCreatedAsync(Guid organizationId, string actorId, CancellationToken cancellationToken = default);

    Task LogTeamCreatedAsync(Guid teamId, string actorId, CancellationToken cancellationToken = default);

    Task LogMemberAddedAsync(string entityType, Guid entityId, string memberUserId, string actorId, CancellationToken cancellationToken = default);

    Task LogMemberRemovedAsync(string entityType, Guid entityId, string memberUserId, string actorId, CancellationToken cancellationToken = default);

    Task LogRoleChangedAsync(Guid organizationId, string memberUserId, OrganizationMemberRole newRole, string actorId, CancellationToken cancellationToken = default);

    Task LogProjectCreatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task LogProjectUpdatedAsync(Guid projectId, string actorId, object? oldValues, object? newValues, CancellationToken cancellationToken = default);

    Task LogProjectArchivedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task LogProjectDeletedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskCreatedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskUpdatedAsync(Guid taskId, string actorId, object? oldValues, object? newValues, CancellationToken cancellationToken = default);

    Task LogTaskDeletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskRestoredAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskAssignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskUnassignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskCompletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogTaskReopenedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogCommentAddedAsync(Guid commentId, Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogCommentEditedAsync(Guid commentId, string actorId, object? oldValues, object? newValues, CancellationToken cancellationToken = default);

    Task LogCommentDeletedAsync(Guid commentId, string actorId, CancellationToken cancellationToken = default);

    Task LogAttachmentUploadedAsync(Guid attachmentId, Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task LogAttachmentDeletedAsync(Guid attachmentId, string actorId, CancellationToken cancellationToken = default);

    Task LogNotificationReadAsync(Guid notificationId, string userId, CancellationToken cancellationToken = default);

    Task LogNotificationDeletedAsync(Guid notificationId, string userId, CancellationToken cancellationToken = default);
}
