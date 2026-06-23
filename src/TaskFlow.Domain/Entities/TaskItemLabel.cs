namespace TaskFlow.Domain.Entities;

public sealed class TaskItemLabel
{
    public Guid TaskId { get; private set; }

    public Guid LabelId { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    public TaskLabel Label { get; private set; } = null!;

    private TaskItemLabel()
    {
    }

    public static TaskItemLabel Create(Guid taskId, Guid labelId)
    {
        return new TaskItemLabel
        {
            TaskId = taskId,
            LabelId = labelId
        };
    }
}
