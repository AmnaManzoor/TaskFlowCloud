using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class AuditTriggerService(
    ApplicationDbContext dbContext,
    IAuditLogPublisher auditPublisher,
    IActivityRecorder activityRecorder) : IAuditTriggerService
{
    public async Task LogUserRegisteredAsync(string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.UserRegistered,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var parsed) ? parsed : null,
            "User registered.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.UserRegistered,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var userGuid) ? userGuid : null,
            "You registered an account.",
            cancellationToken);
    }

    public async Task LogUserLoggedInAsync(string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.UserLoggedIn,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var parsed) ? parsed : null,
            "User logged in.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.UserLoggedIn,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var userGuid) ? userGuid : null,
            "You logged in.",
            cancellationToken);
    }

    public async Task LogUserLoggedOutAsync(string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.UserLoggedOut,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var parsed) ? parsed : null,
            "User logged out.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.UserLoggedOut,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var userGuid) ? userGuid : null,
            "You logged out.",
            cancellationToken);
    }

    public async Task LogPasswordChangedAsync(string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.PasswordChanged,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var parsed) ? parsed : null,
            "Password changed.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.PasswordChanged,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var userGuid) ? userGuid : null,
            "You changed your password.",
            cancellationToken);
    }

    public async Task LogProfileUpdatedAsync(
        string userId,
        object? oldValues,
        object? newValues,
        CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.ProfileUpdated,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var parsed) ? parsed : null,
            "Profile updated.",
            oldValues,
            newValues,
            cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.ProfileUpdated,
            AuditEntityTypes.User,
            Guid.TryParse(userId, out var userGuid) ? userGuid : null,
            "You updated your profile.",
            cancellationToken);
    }

    public Task LogAuthorizationFailedAsync(string? userId, string description, CancellationToken cancellationToken = default) =>
        auditPublisher.RecordAsync(
            userId,
            AuditActions.AuthorizationFailed,
            AuditEntityTypes.User,
            userId is not null && Guid.TryParse(userId, out var parsed) ? parsed : null,
            description,
            cancellationToken: cancellationToken);

    public async Task LogOrganizationCreatedAsync(Guid organizationId, string actorId, CancellationToken cancellationToken = default)
    {
        var name = await GetOrganizationNameAsync(organizationId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.OrganizationCreated,
            AuditEntityTypes.Organization,
            organizationId,
            $"Organization '{name}' created.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.OrganizationCreated,
            AuditEntityTypes.Organization,
            organizationId,
            $"You created organization '{name}'.",
            cancellationToken);
    }

    public async Task LogTeamCreatedAsync(Guid teamId, string actorId, CancellationToken cancellationToken = default)
    {
        var name = await GetTeamNameAsync(teamId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TeamCreated,
            AuditEntityTypes.Team,
            teamId,
            $"Team '{name}' created.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TeamCreated,
            AuditEntityTypes.Team,
            teamId,
            $"You created team '{name}'.",
            cancellationToken);
    }

    public async Task LogMemberAddedAsync(
        string entityType,
        Guid entityId,
        string memberUserId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.MemberAdded,
            entityType,
            entityId,
            $"Member added to {entityType}.",
            newValues: new { MemberUserId = memberUserId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.MemberAdded,
            entityType,
            entityId,
            $"You added a member.",
            cancellationToken);

        await activityRecorder.RecordAsync(
            memberUserId,
            AuditActions.MemberAdded,
            entityType,
            entityId,
            $"You were added as a member.",
            cancellationToken);
    }

    public async Task LogMemberRemovedAsync(
        string entityType,
        Guid entityId,
        string memberUserId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.MemberRemoved,
            entityType,
            entityId,
            $"Member removed from {entityType}.",
            oldValues: new { MemberUserId = memberUserId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.MemberRemoved,
            entityType,
            entityId,
            "You removed a member.",
            cancellationToken);
    }

    public async Task LogRoleChangedAsync(
        Guid organizationId,
        string memberUserId,
        OrganizationMemberRole newRole,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.RoleChanged,
            AuditEntityTypes.Organization,
            organizationId,
            $"Role changed to {newRole}.",
            newValues: new { MemberUserId = memberUserId, Role = newRole },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            memberUserId,
            AuditActions.RoleChanged,
            AuditEntityTypes.Organization,
            organizationId,
            $"Your organization role changed to {newRole}.",
            cancellationToken);
    }

    public async Task LogProjectCreatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var name = await GetProjectNameAsync(projectId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.ProjectCreated,
            AuditEntityTypes.Project,
            projectId,
            $"Project '{name}' created.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.ProjectCreated,
            AuditEntityTypes.Project,
            projectId,
            $"You created project '{name}'.",
            cancellationToken);
    }

    public async Task LogProjectUpdatedAsync(
        Guid projectId,
        string actorId,
        object? oldValues,
        object? newValues,
        CancellationToken cancellationToken = default)
    {
        var name = await GetProjectNameAsync(projectId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.ProjectUpdated,
            AuditEntityTypes.Project,
            projectId,
            $"Project '{name}' updated.",
            oldValues,
            newValues,
            cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.ProjectUpdated,
            AuditEntityTypes.Project,
            projectId,
            $"You updated project '{name}'.",
            cancellationToken);
    }

    public async Task LogProjectArchivedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var name = await GetProjectNameAsync(projectId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.ProjectArchived,
            AuditEntityTypes.Project,
            projectId,
            $"Project '{name}' archived.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.ProjectArchived,
            AuditEntityTypes.Project,
            projectId,
            $"You archived project '{name}'.",
            cancellationToken);
    }

    public async Task LogProjectDeletedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var name = await GetProjectNameAsync(projectId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.ProjectDeleted,
            AuditEntityTypes.Project,
            projectId,
            $"Project '{name}' deleted.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.ProjectDeleted,
            AuditEntityTypes.Project,
            projectId,
            $"You deleted project '{name}'.",
            cancellationToken);
    }

    public async Task LogTaskCreatedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskCreated,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' created.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskCreated,
            AuditEntityTypes.Task,
            taskId,
            $"You created task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskUpdatedAsync(
        Guid taskId,
        string actorId,
        object? oldValues,
        object? newValues,
        CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskUpdated,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' updated.",
            oldValues,
            newValues,
            cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskUpdated,
            AuditEntityTypes.Task,
            taskId,
            $"You updated task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskDeletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskDeleted,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' deleted.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskDeleted,
            AuditEntityTypes.Task,
            taskId,
            $"You deleted task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskRestoredAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskRestored,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' restored.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskRestored,
            AuditEntityTypes.Task,
            taskId,
            $"You restored task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskAssignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskAssigned,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' assigned.",
            newValues: new { AssigneeId = assigneeId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            assigneeId,
            AuditActions.TaskAssigned,
            AuditEntityTypes.Task,
            taskId,
            $"You were assigned to task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskUnassignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskUnassigned,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' unassigned.",
            oldValues: new { AssigneeId = assigneeId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            assigneeId,
            AuditActions.TaskUnassigned,
            AuditEntityTypes.Task,
            taskId,
            $"You were unassigned from task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskCompletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskCompleted,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' completed.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskCompleted,
            AuditEntityTypes.Task,
            taskId,
            $"You completed task '{title}'.",
            cancellationToken);
    }

    public async Task LogTaskReopenedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var title = await GetTaskTitleAsync(taskId, cancellationToken);
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.TaskReopened,
            AuditEntityTypes.Task,
            taskId,
            $"Task '{title}' reopened.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.TaskReopened,
            AuditEntityTypes.Task,
            taskId,
            $"You reopened task '{title}'.",
            cancellationToken);
    }

    public async Task LogCommentAddedAsync(Guid commentId, Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.CommentAdded,
            AuditEntityTypes.Comment,
            commentId,
            "Comment added.",
            newValues: new { TaskId = taskId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.CommentAdded,
            AuditEntityTypes.Comment,
            commentId,
            "You added a comment.",
            cancellationToken);
    }

    public async Task LogCommentEditedAsync(
        Guid commentId,
        string actorId,
        object? oldValues,
        object? newValues,
        CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.CommentEdited,
            AuditEntityTypes.Comment,
            commentId,
            "Comment edited.",
            oldValues,
            newValues,
            cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.CommentEdited,
            AuditEntityTypes.Comment,
            commentId,
            "You edited a comment.",
            cancellationToken);
    }

    public async Task LogCommentDeletedAsync(Guid commentId, string actorId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.CommentDeleted,
            AuditEntityTypes.Comment,
            commentId,
            "Comment deleted.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.CommentDeleted,
            AuditEntityTypes.Comment,
            commentId,
            "You deleted a comment.",
            cancellationToken);
    }

    public async Task LogAttachmentUploadedAsync(Guid attachmentId, Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.AttachmentUploaded,
            AuditEntityTypes.Attachment,
            attachmentId,
            "Attachment uploaded.",
            newValues: new { TaskId = taskId },
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.AttachmentUploaded,
            AuditEntityTypes.Attachment,
            attachmentId,
            "You uploaded an attachment.",
            cancellationToken);
    }

    public async Task LogAttachmentDeletedAsync(Guid attachmentId, string actorId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            actorId,
            AuditActions.AttachmentDeleted,
            AuditEntityTypes.Attachment,
            attachmentId,
            "Attachment deleted.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            actorId,
            AuditActions.AttachmentDeleted,
            AuditEntityTypes.Attachment,
            attachmentId,
            "You deleted an attachment.",
            cancellationToken);
    }

    public async Task LogNotificationReadAsync(Guid notificationId, string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.NotificationRead,
            AuditEntityTypes.Notification,
            notificationId,
            "Notification marked as read.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.NotificationRead,
            AuditEntityTypes.Notification,
            notificationId,
            "You read a notification.",
            cancellationToken);
    }

    public async Task LogNotificationDeletedAsync(Guid notificationId, string userId, CancellationToken cancellationToken = default)
    {
        await auditPublisher.RecordAsync(
            userId,
            AuditActions.NotificationDeleted,
            AuditEntityTypes.Notification,
            notificationId,
            "Notification deleted.",
            cancellationToken: cancellationToken);

        await activityRecorder.RecordAsync(
            userId,
            AuditActions.NotificationDeleted,
            AuditEntityTypes.Notification,
            notificationId,
            "You deleted a notification.",
            cancellationToken);
    }

    private Task<string> GetOrganizationNameAsync(Guid organizationId, CancellationToken cancellationToken) =>
        dbContext.Organizations.AsNoTracking()
            .Where(organization => organization.Id == organizationId)
            .Select(organization => organization.Name)
            .SingleAsync(cancellationToken);

    private Task<string> GetTeamNameAsync(Guid teamId, CancellationToken cancellationToken) =>
        dbContext.Teams.AsNoTracking()
            .Where(team => team.Id == teamId)
            .Select(team => team.Name)
            .SingleAsync(cancellationToken);

    private Task<string> GetProjectNameAsync(Guid projectId, CancellationToken cancellationToken) =>
        dbContext.Projects.IgnoreQueryFilters().AsNoTracking()
            .Where(project => project.Id == projectId)
            .Select(project => project.Name)
            .SingleAsync(cancellationToken);

    private Task<string> GetTaskTitleAsync(Guid taskId, CancellationToken cancellationToken) =>
        dbContext.Tasks.IgnoreQueryFilters().AsNoTracking()
            .Where(task => task.Id == taskId)
            .Select(task => task.Title)
            .SingleAsync(cancellationToken);
}
