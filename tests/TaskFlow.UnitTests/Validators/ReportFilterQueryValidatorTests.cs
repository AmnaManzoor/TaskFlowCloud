using TaskFlow.Application.Validators.Dashboard;

namespace TaskFlow.UnitTests.Validators;

public class ReportFilterQueryValidatorTests
{
    private readonly ReportFilterQueryValidator _validator = new();

    [Fact]
    public void ValidQuery_PassesValidation()
    {
        var result = _validator.Validate(new Application.DTOs.Dashboard.ReportFilterQuery());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void InvalidPageSize_FailsValidation()
    {
        var result = _validator.Validate(new Application.DTOs.Dashboard.ReportFilterQuery(PageSize: 0));
        Assert.False(result.IsValid);
    }
}
