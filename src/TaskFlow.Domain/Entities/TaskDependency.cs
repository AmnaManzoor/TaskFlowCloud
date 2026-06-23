namespace TaskFlow.Domain.Entities;

public sealed class TaskDependency
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TaskId { get; private set; }

    public Guid DependsOnTaskId { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    public TaskItem DependsOnTask { get; private set; } = null!;

    private TaskDependency()
    {
    }

    public static TaskDependency Create(Guid taskId, Guid dependsOnTaskId)
    {
        if (taskId == dependsOnTaskId)
        {
            throw new InvalidOperationException("A task cannot depend on itself.");
        }

        return new TaskDependency
        {
            TaskId = taskId,
            DependsOnTaskId = dependsOnTaskId
        };
    }
}
