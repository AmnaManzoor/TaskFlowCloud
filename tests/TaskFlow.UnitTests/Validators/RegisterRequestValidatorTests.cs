using FluentValidation.TestHelper;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Validators.Auth;

namespace TaskFlow.UnitTests.Validators;

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    [Fact]
    public void ValidRequest_PassesValidation()
    {
        var request = new RegisterRequest(
            "user@taskflow.test",
            "Password123!",
            "Password123!",
            "Jane",
            "Doe");

        var result = _validator.TestValidate(request);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void MismatchedPasswords_FailsValidation()
    {
        var request = new RegisterRequest(
            "user@taskflow.test",
            "Password123!",
            "Different123!",
            "Jane",
            "Doe");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword);
    }

    [Fact]
    public void WeakPassword_FailsValidation()
    {
        var request = new RegisterRequest(
            "user@taskflow.test",
            "password",
            "password",
            "Jane",
            "Doe");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
