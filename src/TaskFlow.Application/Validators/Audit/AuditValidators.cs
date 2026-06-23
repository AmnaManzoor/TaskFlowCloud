using FluentValidation;
using TaskFlow.Application.DTOs.Audit;

namespace TaskFlow.Application.Validators.Audit;

public sealed class AuditLogListQueryValidator : AbstractValidator<AuditLogListQuery>
{
    public AuditLogListQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThan(0);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
        RuleFor(query => query.CreatedTo)
            .GreaterThanOrEqualTo(query => query.CreatedFrom)
            .When(query => query.CreatedFrom.HasValue && query.CreatedTo.HasValue);
    }
}

public sealed class ActivityHistoryListQueryValidator : AbstractValidator<ActivityHistoryListQuery>
{
    public ActivityHistoryListQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThan(0);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
        RuleFor(query => query.CreatedTo)
            .GreaterThanOrEqualTo(query => query.CreatedFrom)
            .When(query => query.CreatedFrom.HasValue && query.CreatedTo.HasValue);
    }
}
