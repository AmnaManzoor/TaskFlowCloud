namespace TaskFlow.Domain.Entities;

public sealed class TaskComment
{
    public const string DeletedPlaceholder = "Comment deleted";

    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TaskId { get; private set; }

    public string UserId { get; private set; } = string.Empty;

    public Guid? ParentCommentId { get; private set; }

    public string Content { get; private set; } = string.Empty;

    public bool IsEdited { get; private set; }

    public DateTimeOffset? EditedAt { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? UpdatedAt { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    public TaskComment? ParentComment { get; private set; }

    public ICollection<TaskComment> Replies { get; private set; } = [];

    public ICollection<Mention> Mentions { get; private set; } = [];

    private TaskComment()
    {
    }

    public static TaskComment Create(
        Guid taskId,
        string userId,
        string content,
        Guid? parentCommentId = null)
    {
        return new TaskComment
        {
            TaskId = taskId,
            UserId = userId,
            Content = content,
            ParentCommentId = parentCommentId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Edit(string content)
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("Deleted comments cannot be edited.");
        }

        Content = content;
        IsEdited = true;
        EditedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        Content = DeletedPlaceholder;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
