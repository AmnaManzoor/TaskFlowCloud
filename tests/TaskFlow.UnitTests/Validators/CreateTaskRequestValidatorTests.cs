using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Validators.Tasks;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Validators;

public class CreateTaskRequestValidatorTests
{
    private readonly CreateTaskRequestValidator _validator = new();

    [Fact]
    public void ValidRequest_PassesValidation()
    {
        var request = new CreateTaskRequest(
            Guid.NewGuid(),
            "Implement login",
            "Add JWT authentication",
            TaskStatus.Todo,
            TaskPriority.High,
            TaskType.Feature);

        var result = _validator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void EmptyTitle_FailsValidation()
    {
        var request = new CreateTaskRequest(Guid.NewGuid(), string.Empty, null);
        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void DueDateBeforeStartDate_FailsValidation()
    {
        var request = new CreateTaskRequest(
            Guid.NewGuid(),
            "Task",
            null,
            StartDate: new DateOnly(2026, 6, 10),
            DueDate: new DateOnly(2026, 6, 1));

        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }
}

public class AddTaskDependencyRequestValidatorTests
{
    [Fact]
    public void EmptyDependsOnTaskId_FailsValidation()
    {
        var validator = new AddTaskDependencyRequestValidator();
        var result = validator.Validate(new AddTaskDependencyRequest(Guid.Empty));
        Assert.False(result.IsValid);
    }
}
