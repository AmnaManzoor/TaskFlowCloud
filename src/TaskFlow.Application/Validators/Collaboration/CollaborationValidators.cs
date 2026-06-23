using FluentValidation;
using TaskFlow.Application.DTOs.Collaboration;

namespace TaskFlow.Application.Validators.Collaboration;

public sealed class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(10000);
    }
}

public sealed class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(10000);
    }
}

public sealed class ReplyCommentRequestValidator : AbstractValidator<ReplyCommentRequest>
{
    public ReplyCommentRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(10000);
    }
}

public sealed class AddMentionsRequestValidator : AbstractValidator<AddMentionsRequest>
{
    public AddMentionsRequestValidator()
    {
        RuleFor(x => x.MentionedUserIds).NotEmpty();
        RuleForEach(x => x.MentionedUserIds).NotEmpty();
    }
}

public sealed class UploadAttachmentRequestValidator : AbstractValidator<UploadAttachmentRequest>
{
    public UploadAttachmentRequestValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.FileSize).GreaterThan(0);
        RuleFor(x => x.FileStream).NotNull();
    }
}
