namespace TaskFlow.Domain.Constants;

public static class AuditActions
{
    public const string UserRegistered = "User Registered";
    public const string UserLoggedIn = "User Logged In";
    public const string UserLoggedOut = "User Logged Out";
    public const string PasswordChanged = "Password Changed";
    public const string ProfileUpdated = "Profile Updated";
    public const string AuthorizationFailed = "Authorization Failed";

    public const string OrganizationCreated = "Organization Created";
    public const string TeamCreated = "Team Created";
    public const string MemberAdded = "Member Added";
    public const string MemberRemoved = "Member Removed";
    public const string RoleChanged = "Role Changed";

    public const string ProjectCreated = "Project Created";
    public const string ProjectUpdated = "Project Updated";
    public const string ProjectArchived = "Project Archived";
    public const string ProjectDeleted = "Project Deleted";
    public const string ProjectRestored = "Project Restored";

    public const string TaskCreated = "Task Created";
    public const string TaskUpdated = "Task Updated";
    public const string TaskDeleted = "Task Deleted";
    public const string TaskRestored = "Task Restored";
    public const string TaskAssigned = "Task Assigned";
    public const string TaskUnassigned = "Task Unassigned";
    public const string TaskCompleted = "Task Completed";
    public const string TaskReopened = "Task Reopened";

    public const string CommentAdded = "Comment Added";
    public const string CommentEdited = "Comment Edited";
    public const string CommentDeleted = "Comment Deleted";

    public const string AttachmentUploaded = "Attachment Uploaded";
    public const string AttachmentDeleted = "Attachment Deleted";

    public const string NotificationRead = "Notification Read";
    public const string NotificationDeleted = "Notification Deleted";
}
