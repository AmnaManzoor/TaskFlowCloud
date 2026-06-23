using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Interfaces.Notifications;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public interface INotificationTriggerService
{
    Task NotifyTaskAssignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskUnassignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskCompletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskReopenedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskPriorityChangedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskDueDateChangedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskUpdatedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyTaskCommentAddedAsync(Guid taskId, Guid commentId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyMentionedInCommentAsync(Guid commentId, IEnumerable<string> mentionedUserIds, string actorId, CancellationToken cancellationToken = default);

    Task NotifyProjectCreatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyProjectUpdatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyProjectArchivedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyProjectOwnershipTransferredAsync(Guid projectId, string previousOwnerId, string newOwnerId, string actorId, CancellationToken cancellationToken = default);

    Task NotifyOrganizationRoleChangedAsync(Guid organizationId, string memberUserId, OrganizationMemberRole newRole, CancellationToken cancellationToken = default);

    Task NotifyOrganizationMemberAddedAsync(Guid organizationId, string memberUserId, CancellationToken cancellationToken = default);

    Task NotifyTeamMemberAddedAsync(Guid teamId, string memberUserId, CancellationToken cancellationToken = default);
}

public sealed class NotificationTriggerService(
    ApplicationDbContext dbContext,
    INotificationPublisher publisher) : INotificationTriggerService
{
    public async Task NotifyTaskAssignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        await publisher.PublishAsync(
            assigneeId,
            NotificationType.TaskAssigned,
            "Task assigned",
            $"You were assigned to '{task.Title}'.",
            NotificationReferenceTypes.Task,
            taskId,
            cancellationToken);
    }

    public async Task NotifyTaskUnassignedAsync(Guid taskId, string assigneeId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        await publisher.PublishAsync(
            assigneeId,
            NotificationType.TaskUnassigned,
            "Task unassigned",
            $"You were unassigned from '{task.Title}'.",
            NotificationReferenceTypes.Task,
            taskId,
            cancellationToken);
    }

    public async Task NotifyTaskCompletedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskCompleted,
            "Task completed",
            $"'{task.Title}' was marked as completed.",
            NotificationReferenceTypes.Task,
            taskId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyTaskReopenedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskReopened,
            "Task reopened",
            $"'{task.Title}' was reopened.",
            NotificationReferenceTypes.Task,
            taskId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyTaskPriorityChangedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskPriorityChanged,
            "Task priority changed",
            $"Priority changed for '{task.Title}'.",
            NotificationReferenceTypes.Task,
            taskId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyTaskDueDateChangedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskDueDateChanged,
            "Task due date changed",
            $"Due date changed for '{task.Title}'.",
            NotificationReferenceTypes.Task,
            taskId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyTaskUpdatedAsync(Guid taskId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskUpdated,
            "Task updated",
            $"'{task.Title}' was updated.",
            NotificationReferenceTypes.Task,
            taskId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyTaskCommentAddedAsync(Guid taskId, Guid commentId, string actorId, CancellationToken cancellationToken = default)
    {
        var task = await GetTaskSummaryAsync(taskId, cancellationToken);
        var assignees = await GetTaskAssigneeIdsAsync(taskId, cancellationToken);
        await publisher.PublishToManyAsync(
            assignees,
            NotificationType.TaskCommentAdded,
            "New comment",
            $"A new comment was added on '{task.Title}'.",
            NotificationReferenceTypes.Comment,
            commentId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyMentionedInCommentAsync(
        Guid commentId,
        IEnumerable<string> mentionedUserIds,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        await publisher.PublishToManyAsync(
            mentionedUserIds,
            NotificationType.MentionedInComment,
            "You were mentioned",
            "You were mentioned in a comment.",
            NotificationReferenceTypes.Comment,
            commentId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyProjectCreatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var project = await GetProjectSummaryAsync(projectId, cancellationToken);
        var members = await dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.ProjectId == projectId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        await publisher.PublishToManyAsync(
            members,
            NotificationType.ProjectCreated,
            "Project created",
            $"Project '{project}' was created.",
            NotificationReferenceTypes.Project,
            projectId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyProjectUpdatedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var project = await GetProjectSummaryAsync(projectId, cancellationToken);
        var members = await dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.ProjectId == projectId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        await publisher.PublishToManyAsync(
            members,
            NotificationType.ProjectUpdated,
            "Project updated",
            $"Project '{project}' was updated.",
            NotificationReferenceTypes.Project,
            projectId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyProjectArchivedAsync(Guid projectId, string actorId, CancellationToken cancellationToken = default)
    {
        var project = await GetProjectSummaryAsync(projectId, cancellationToken);
        var members = await dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.ProjectId == projectId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        await publisher.PublishToManyAsync(
            members,
            NotificationType.ProjectArchived,
            "Project archived",
            $"Project '{project}' was archived.",
            NotificationReferenceTypes.Project,
            projectId,
            actorId,
            cancellationToken);
    }

    public async Task NotifyProjectOwnershipTransferredAsync(
        Guid projectId,
        string previousOwnerId,
        string newOwnerId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        var project = await GetProjectSummaryAsync(projectId, cancellationToken);

        await publisher.PublishAsync(
            newOwnerId,
            NotificationType.ProjectOwnershipTransferred,
            "Project ownership transferred",
            $"You are now the owner of '{project}'.",
            NotificationReferenceTypes.Project,
            projectId,
            cancellationToken);

        if (!string.Equals(previousOwnerId, newOwnerId, StringComparison.Ordinal))
        {
            await publisher.PublishAsync(
                previousOwnerId,
                NotificationType.ProjectOwnershipTransferred,
                "Project ownership transferred",
                $"Ownership of '{project}' was transferred.",
                NotificationReferenceTypes.Project,
                projectId,
                cancellationToken);
        }
    }

    public async Task NotifyOrganizationRoleChangedAsync(
        Guid organizationId,
        string memberUserId,
        OrganizationMemberRole newRole,
        CancellationToken cancellationToken = default)
    {
        var organization = await GetOrganizationSummaryAsync(organizationId, cancellationToken);
        await publisher.PublishAsync(
            memberUserId,
            NotificationType.RoleChanged,
            "Role changed",
            $"Your role in '{organization}' was changed to {newRole}.",
            NotificationReferenceTypes.Organization,
            organizationId,
            cancellationToken);
    }

    public async Task NotifyOrganizationMemberAddedAsync(
        Guid organizationId,
        string memberUserId,
        CancellationToken cancellationToken = default)
    {
        var organization = await GetOrganizationSummaryAsync(organizationId, cancellationToken);
        await publisher.PublishAsync(
            memberUserId,
            NotificationType.OrganizationInvitation,
            "Organization invitation",
            $"You were added to '{organization}'.",
            NotificationReferenceTypes.Organization,
            organizationId,
            cancellationToken);
    }

    public async Task NotifyTeamMemberAddedAsync(Guid teamId, string memberUserId, CancellationToken cancellationToken = default)
    {
        var team = await dbContext.Teams
            .AsNoTracking()
            .Where(entry => entry.Id == teamId)
            .Select(entry => new { entry.Name })
            .SingleAsync(cancellationToken);

        await publisher.PublishAsync(
            memberUserId,
            NotificationType.TeamMemberAdded,
            "Team member added",
            $"You were added to team '{team.Name}'.",
            NotificationReferenceTypes.Team,
            teamId,
            cancellationToken);
    }

    private async Task<(string Title, Guid ProjectId)> GetTaskSummaryAsync(Guid taskId, CancellationToken cancellationToken) =>
        await dbContext.Tasks
            .AsNoTracking()
            .Where(task => task.Id == taskId)
            .Select(task => new ValueTuple<string, Guid>(task.Title, task.ProjectId))
            .SingleAsync(cancellationToken);

    private async Task<List<string>> GetTaskAssigneeIdsAsync(Guid taskId, CancellationToken cancellationToken) =>
        await dbContext.TaskAssignments
            .AsNoTracking()
            .Where(assignment => assignment.TaskId == taskId)
            .Select(assignment => assignment.UserId)
            .ToListAsync(cancellationToken);

    private async Task<string> GetProjectSummaryAsync(Guid projectId, CancellationToken cancellationToken) =>
        await dbContext.Projects
            .AsNoTracking()
            .Where(project => project.Id == projectId)
            .Select(project => project.Name)
            .SingleAsync(cancellationToken);

    private async Task<string> GetOrganizationSummaryAsync(Guid organizationId, CancellationToken cancellationToken) =>
        await dbContext.Organizations
            .AsNoTracking()
            .Where(organization => organization.Id == organizationId)
            .Select(organization => organization.Name)
            .SingleAsync(cancellationToken);
}
