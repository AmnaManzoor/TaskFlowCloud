using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Validators.Collaboration;

namespace TaskFlow.UnitTests.Validators;

public class CreateCommentRequestValidatorTests
{
    private readonly CreateCommentRequestValidator _validator = new();

    [Fact]
    public void ValidComment_PassesValidation()
    {
        var result = _validator.Validate(new CreateCommentRequest("This is a valid comment."));
        Assert.True(result.IsValid);
    }

    [Fact]
    public void EmptyContent_FailsValidation()
    {
        var result = _validator.Validate(new CreateCommentRequest(string.Empty));
        Assert.False(result.IsValid);
    }
}

public class UploadAttachmentRequestValidatorTests
{
    private readonly UploadAttachmentRequestValidator _validator = new();

    [Fact]
    public void ValidUpload_PassesValidation()
    {
        using var stream = new MemoryStream([1, 2, 3]);
        var request = new UploadAttachmentRequest(stream, "document.pdf", "application/pdf", 3);
        var result = _validator.Validate(request);
        Assert.True(result.IsValid);
    }
}
