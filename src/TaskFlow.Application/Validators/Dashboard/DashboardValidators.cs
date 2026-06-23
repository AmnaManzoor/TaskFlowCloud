using FluentValidation;
using TaskFlow.Application.DTOs.Dashboard;

namespace TaskFlow.Application.Validators.Dashboard;

public sealed class ReportFilterQueryValidator : AbstractValidator<ReportFilterQuery>
{
    public ReportFilterQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThan(0);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 100);
        RuleFor(query => query.DateTo)
            .GreaterThanOrEqualTo(query => query.DateFrom)
            .When(query => query.DateFrom.HasValue && query.DateTo.HasValue);
    }
}
