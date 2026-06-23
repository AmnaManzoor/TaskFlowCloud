using FluentValidation;
using TaskFlow.Application.DTOs.Projects;

namespace TaskFlow.Application.Validators.Projects;

public sealed class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.OrganizationId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[A-Za-z0-9_-]+$")
            .WithMessage("Project code may only contain letters, numbers, hyphens, and underscores.");
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("End date must be on or after the start date.");
    }
}

public sealed class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.RowVersion).NotEmpty();
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("End date must be on or after the start date.");
    }
}

public sealed class TransferProjectOwnershipRequestValidator : AbstractValidator<TransferProjectOwnershipRequest>
{
    public TransferProjectOwnershipRequestValidator()
    {
        RuleFor(x => x.NewOwnerId).NotEmpty();
    }
}

public sealed class ChangeProjectStatusRequestValidator : AbstractValidator<ChangeProjectStatusRequest>
{
    public ChangeProjectStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class ChangeProjectPriorityRequestValidator : AbstractValidator<ChangeProjectPriorityRequest>
{
    public ChangeProjectPriorityRequestValidator()
    {
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class AddProjectMemberRequestValidator : AbstractValidator<AddProjectMemberRequest>
{
    public AddProjectMemberRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Role).IsInEnum();
        RuleFor(x => x.Role)
            .NotEqual(Domain.Enums.ProjectRole.Owner)
            .WithMessage("Use the transfer ownership endpoint to assign project owners.");
    }
}

public sealed class UpdateProjectMemberRoleRequestValidator : AbstractValidator<UpdateProjectMemberRoleRequest>
{
    public UpdateProjectMemberRoleRequestValidator()
    {
        RuleFor(x => x.Role).IsInEnum();
        RuleFor(x => x.Role)
            .NotEqual(Domain.Enums.ProjectRole.Owner)
            .WithMessage("Use the transfer ownership endpoint to assign project owners.");
    }
}
