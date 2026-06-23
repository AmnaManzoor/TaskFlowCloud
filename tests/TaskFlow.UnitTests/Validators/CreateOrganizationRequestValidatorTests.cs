using FluentValidation.TestHelper;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.Validators.Organizations;

namespace TaskFlow.UnitTests.Validators;

public class CreateOrganizationRequestValidatorTests
{
    private readonly CreateOrganizationRequestValidator _validator = new();

    [Fact]
    public void ValidRequest_PassesValidation()
    {
        var request = new CreateOrganizationRequest("Acme Corp", "Description", null);
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyName_FailsValidation()
    {
        var request = new CreateOrganizationRequest(string.Empty, null, null);
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}
