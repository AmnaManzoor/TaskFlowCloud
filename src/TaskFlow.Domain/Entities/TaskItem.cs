using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public sealed class TaskItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid ProjectId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public TaskStatus Status { get; private set; } = TaskStatus.Backlog;

    public TaskPriority Priority { get; private set; } = TaskPriority.Medium;

    public TaskType Type { get; private set; } = TaskType.Feature;

    public DateOnly? StartDate { get; private set; }

    public DateOnly? DueDate { get; private set; }

    public DateTimeOffset? CompletedAt { get; private set; }

    public decimal? EstimatedHours { get; private set; }

    public decimal? ActualHours { get; private set; }

    public int? StoryPoints { get; private set; }

    public Guid? ParentTaskId { get; private set; }

    public string CreatedBy { get; private set; } = string.Empty;

    public string? UpdatedBy { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? UpdatedAt { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public byte[] RowVersion { get; private set; } = [];

    public Project Project { get; private set; } = null!;

    public TaskItem? ParentTask { get; private set; }

    public ICollection<TaskItem> Subtasks { get; private set; } = [];

    public ICollection<TaskAssignment> Assignments { get; private set; } = [];

    public ICollection<TaskItemLabel> Labels { get; private set; } = [];

    public ICollection<TaskDependency> Dependencies { get; private set; } = [];

    public ICollection<TaskDependency> DependentTasks { get; private set; } = [];

    public ICollection<Checklist> Checklists { get; private set; } = [];

    public ICollection<TaskComment> Comments { get; private set; } = [];

    public ICollection<Attachment> Attachments { get; private set; } = [];

    private TaskItem()
    {
    }

    public static TaskItem Create(
        Guid projectId,
        string title,
        string? description,
        TaskStatus status,
        TaskPriority priority,
        TaskType type,
        DateOnly? startDate,
        DateOnly? dueDate,
        decimal? estimatedHours,
        int? storyPoints,
        Guid? parentTaskId,
        string createdBy)
    {
        var task = new TaskItem
        {
            ProjectId = projectId,
            Title = title,
            Description = description,
            Status = status,
            Priority = priority,
            Type = type,
            StartDate = startDate,
            DueDate = dueDate,
            EstimatedHours = estimatedHours,
            StoryPoints = storyPoints,
            ParentTaskId = parentTaskId,
            CreatedBy = createdBy,
            CreatedAt = DateTimeOffset.UtcNow
        };

        task.ApplyCompletionTimestamp(status);
        return task;
    }

    public void Update(
        string title,
        string? description,
        TaskType type,
        DateOnly? startDate,
        DateOnly? dueDate,
        decimal? estimatedHours,
        decimal? actualHours,
        int? storyPoints,
        string updatedBy)
    {
        Title = title;
        Description = description;
        Type = type;
        StartDate = startDate;
        DueDate = dueDate;
        EstimatedHours = estimatedHours;
        ActualHours = actualHours;
        StoryPoints = storyPoints;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ChangeStatus(TaskStatus status, string updatedBy)
    {
        Status = status;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
        ApplyCompletionTimestamp(status);
    }

    public void ChangePriority(TaskPriority priority, string updatedBy)
    {
        Priority = priority;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateHours(decimal? estimatedHours, decimal? actualHours, string updatedBy)
    {
        EstimatedHours = estimatedHours;
        ActualHours = actualHours;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MoveToProject(Guid targetProjectId, string updatedBy)
    {
        ProjectId = targetProjectId;
        ParentTaskId = null;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive(string updatedBy)
    {
        ChangeStatus(TaskStatus.Cancelled, updatedBy);
    }

    public void SoftDelete(string updatedBy)
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Restore(string updatedBy)
    {
        IsDeleted = false;
        DeletedAt = null;
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private void ApplyCompletionTimestamp(TaskStatus status)
    {
        CompletedAt = status == TaskStatus.Completed ? DateTimeOffset.UtcNow : null;
    }
}
