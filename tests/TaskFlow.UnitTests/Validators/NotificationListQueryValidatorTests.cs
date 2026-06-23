using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.Validators.Notifications;

namespace TaskFlow.UnitTests.Validators;

public class NotificationListQueryValidatorTests
{
    private readonly NotificationListQueryValidator _validator = new();

    [Fact]
    public void ValidQuery_PassesValidation()
    {
        var result = _validator.Validate(new NotificationListQuery());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void InvalidPageSize_FailsValidation()
    {
        var result = _validator.Validate(new NotificationListQuery(PageSize: 0));
        Assert.False(result.IsValid);
    }
}
