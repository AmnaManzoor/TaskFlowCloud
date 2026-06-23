using FluentValidation;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.DTOs.Tasks;

namespace TaskFlow.Application.Validators.Tasks;

public sealed class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(8000);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.EstimatedHours).GreaterThanOrEqualTo(0).When(x => x.EstimatedHours.HasValue);
        RuleFor(x => x.StoryPoints).GreaterThanOrEqualTo(0).When(x => x.StoryPoints.HasValue);
        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue)
            .WithMessage("Due date cannot be earlier than start date.");
    }
}

public sealed class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(8000);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.RowVersion).NotEmpty();
        RuleFor(x => x.EstimatedHours).GreaterThanOrEqualTo(0).When(x => x.EstimatedHours.HasValue);
        RuleFor(x => x.ActualHours).GreaterThanOrEqualTo(0).When(x => x.ActualHours.HasValue);
        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);
    }
}

public sealed class AssignTaskUsersRequestValidator : AbstractValidator<AssignTaskUsersRequest>
{
    public AssignTaskUsersRequestValidator()
    {
        RuleFor(x => x.UserIds).NotEmpty();
        RuleForEach(x => x.UserIds).NotEmpty();
    }
}

public sealed class ChangeTaskStatusRequestValidator : AbstractValidator<ChangeTaskStatusRequest>
{
    public ChangeTaskStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class ChangeTaskPriorityRequestValidator : AbstractValidator<ChangeTaskPriorityRequest>
{
    public ChangeTaskPriorityRequestValidator()
    {
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class MoveTaskRequestValidator : AbstractValidator<MoveTaskRequest>
{
    public MoveTaskRequestValidator()
    {
        RuleFor(x => x.TargetProjectId).NotEmpty();
    }
}

public sealed class CreateSubtaskRequestValidator : AbstractValidator<CreateSubtaskRequest>
{
    public CreateSubtaskRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(8000);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Type).IsInEnum();
    }
}

public sealed class AddTaskLabelRequestValidator : AbstractValidator<AddTaskLabelRequest>
{
    public AddTaskLabelRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.LabelId.HasValue || !string.IsNullOrWhiteSpace(x.Name))
            .WithMessage("Either labelId or name must be provided.");
        RuleFor(x => x.Name).MaximumLength(100);
        RuleFor(x => x.Color).MaximumLength(20);
    }
}

public sealed class AddTaskDependencyRequestValidator : AbstractValidator<AddTaskDependencyRequest>
{
    public AddTaskDependencyRequestValidator()
    {
        RuleFor(x => x.DependsOnTaskId).NotEmpty();
    }
}

public sealed class CreateChecklistRequestValidator : AbstractValidator<CreateChecklistRequest>
{
    public CreateChecklistRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Order).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateChecklistRequestValidator : AbstractValidator<UpdateChecklistRequest>
{
    public UpdateChecklistRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Order).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateTaskHoursRequestValidator : AbstractValidator<UpdateTaskHoursRequest>
{
    public UpdateTaskHoursRequestValidator()
    {
        RuleFor(x => x.EstimatedHours).GreaterThanOrEqualTo(0).When(x => x.EstimatedHours.HasValue);
        RuleFor(x => x.ActualHours).GreaterThanOrEqualTo(0).When(x => x.ActualHours.HasValue);
        RuleFor(x => x)
            .Must(x => x.EstimatedHours.HasValue || x.ActualHours.HasValue)
            .WithMessage("At least one hours value must be provided.");
    }
}

public sealed class CloneTaskRequestValidator : AbstractValidator<CloneTaskRequest>
{
    public CloneTaskRequestValidator()
    {
    }
}
