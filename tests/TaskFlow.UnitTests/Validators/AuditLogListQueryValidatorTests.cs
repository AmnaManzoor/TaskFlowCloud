using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.Validators.Audit;

namespace TaskFlow.UnitTests.Validators;

public class AuditLogListQueryValidatorTests
{
    private readonly AuditLogListQueryValidator _validator = new();

    [Fact]
    public void ValidQuery_PassesValidation()
    {
        var result = _validator.Validate(new AuditLogListQuery());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void InvalidPageSize_FailsValidation()
    {
        var result = _validator.Validate(new AuditLogListQuery(PageSize: 0));
        Assert.False(result.IsValid);
    }
}
