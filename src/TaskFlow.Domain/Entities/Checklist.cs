namespace TaskFlow.Domain.Entities;

public sealed class Checklist
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TaskId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public bool IsCompleted { get; private set; }

    public int Order { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    private Checklist()
    {
    }

    public static Checklist Create(Guid taskId, string title, int order)
    {
        return new Checklist
        {
            TaskId = taskId,
            Title = title,
            Order = order
        };
    }

    public void Update(string title, bool isCompleted, int order)
    {
        Title = title;
        IsCompleted = isCompleted;
        Order = order;
    }
}
