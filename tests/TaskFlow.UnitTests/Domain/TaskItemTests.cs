using TaskFlow.Domain.Entities;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Domain;

public class TaskItemTests
{
    [Fact]
    public void ChangeStatus_ToCompleted_SetsCompletedAt()
    {
        var task = TaskItem.Create(
            Guid.NewGuid(),
            "Test task",
            null,
            TaskStatus.Todo,
            TaskPriority.Medium,
            TaskType.Feature,
            null,
            null,
            null,
            null,
            null,
            "user-id");

        task.ChangeStatus(TaskStatus.Completed, "user-id");

        Assert.Equal(TaskStatus.Completed, task.Status);
        Assert.NotNull(task.CompletedAt);
    }

    [Fact]
    public void ChangeStatus_FromCompleted_ClearsCompletedAt()
    {
        var task = TaskItem.Create(
            Guid.NewGuid(),
            "Test task",
            null,
            TaskStatus.Completed,
            TaskPriority.Medium,
            TaskType.Feature,
            null,
            null,
            null,
            null,
            null,
            "user-id");

        task.ChangeStatus(TaskStatus.InProgress, "user-id");

        Assert.Null(task.CompletedAt);
    }

    [Fact]
    public void TaskDependency_Create_WithSameId_Throws()
    {
        var taskId = Guid.NewGuid();
        Assert.Throws<InvalidOperationException>(() => TaskDependency.Create(taskId, taskId));
    }
}
