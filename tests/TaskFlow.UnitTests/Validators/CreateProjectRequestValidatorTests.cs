using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Validators.Projects;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Validators;

public class CreateProjectRequestValidatorTests
{
    private readonly CreateProjectRequestValidator _validator = new();

    [Fact]
    public void ValidRequest_PassesValidation()
    {
        var request = new CreateProjectRequest(
            Guid.NewGuid(),
            "Customer Portal",
            "CUST-PORTAL",
            "Description",
            ProjectStatus.Draft,
            ProjectPriority.Medium);

        var result = _validator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void InvalidCode_FailsValidation()
    {
        var request = new CreateProjectRequest(
            Guid.NewGuid(),
            "Customer Portal",
            "invalid code!",
            "Description");

        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void EndDateBeforeStartDate_FailsValidation()
    {
        var request = new CreateProjectRequest(
            Guid.NewGuid(),
            "Customer Portal",
            "CUST-PORTAL",
            null,
            StartDate: new DateOnly(2026, 6, 1),
            EndDate: new DateOnly(2026, 5, 1));

        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }
}

public class UpdateProjectRequestValidatorTests
{
    private readonly UpdateProjectRequestValidator _validator = new();

    [Fact]
    public void MissingRowVersion_FailsValidation()
    {
        var request = new UpdateProjectRequest(
            "Updated",
            null,
            null,
            null,
            null,
            string.Empty);

        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }
}

public class AddProjectMemberRequestValidatorTests
{
    private readonly AddProjectMemberRequestValidator _validator = new();

    [Fact]
    public void OwnerRole_FailsValidation()
    {
        var request = new AddProjectMemberRequest("user-id", ProjectRole.Owner);
        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
    }
}
