namespace TaskFlow.Domain.Enums;

public enum NotificationType
{
    TaskAssigned = 0,
    TaskUnassigned = 1,
    TaskUpdated = 2,
    TaskCompleted = 3,
    TaskReopened = 4,
    TaskPriorityChanged = 5,
    TaskDueDateChanged = 6,
    TaskCommentAdded = 7,
    MentionedInComment = 8,
    ProjectCreated = 9,
    ProjectUpdated = 10,
    ProjectArchived = 11,
    ProjectOwnershipTransferred = 12,
    OrganizationInvitation = 13,
    RoleChanged = 14,
    TeamMemberAdded = 15,
    SystemNotification = 16
}
