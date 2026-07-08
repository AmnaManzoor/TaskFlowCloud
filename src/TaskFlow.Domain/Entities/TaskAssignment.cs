  namespace TaskFlow.Domain.Entities;

public sealed class TaskAssignment
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TaskId { get; private set; }

    public string UserId { get; private set; } = string.Empty;

    public string AssignedBy { get; private set; } = string.Empty;

    public DateTimeOffset AssignedAt { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    private TaskAssignment()
    {
    }

    public static TaskAssignment Create(Guid taskId, string userId, string assignedBy)
    {
        return new TaskAssignment
        {
            TaskId = taskId,
            UserId = userId,
            AssignedBy = assignedBy,
            AssignedAt = DateTimeOffset.UtcNow
        };
    }
}
