namespace TaskFlow.Domain.Entities;

public sealed class TaskLabel
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string Name { get; private set; } = string.Empty;

    public string Color { get; private set; } = "#6B7280";

    public ICollection<TaskItemLabel> Tasks { get; private set; } = [];

    private TaskLabel()
    {
    }

    public static TaskLabel Create(string name, string color)
    {
        return new TaskLabel
        {
            Name = name,
            Color = color
        };
    }

    public void Update(string name, string color)
    {
        Name = name;
        Color = color;
    }
}
