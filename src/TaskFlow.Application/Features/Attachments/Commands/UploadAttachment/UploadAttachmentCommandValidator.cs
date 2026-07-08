using FluentValidation;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;

namespace TaskFlow.Application.Features.Attachments.Commands.UploadAttachment;

public sealed class UploadAttachmentCommandValidator : AbstractValidator<UploadAttachmentCommand>
{
    public UploadAttachmentCommandValidator(IOptions<FileStorageOptions> fileStorageOptions)
    {
        var options = fileStorageOptions.Value;

        RuleFor(x => x.CurrentUserId).NotEmpty();
        RuleFor(x => x.TaskId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .LessThanOrEqualTo(options.MaxAttachmentSizeBytes);
        RuleFor(x => x.FileStream).NotNull();

        RuleFor(x => x.FileName)
            .Must(fileName => HasAllowedExtension(fileName, options))
            .WithMessage("File extension is not allowed.");

        RuleFor(x => x.FileName)
            .Must(fileName => !HasBlockedExtension(fileName, options))
            .WithMessage("Executable and script file types are not allowed.");

        RuleFor(x => x.ContentType)
            .Must(options.AllowedAttachmentContentTypes.Contains)
            .WithMessage("Content type is not allowed.");
    }

    private static bool HasAllowedExtension(string fileName, FileStorageOptions options)
    {
        var extension = Path.GetExtension(fileName);
        return !string.IsNullOrWhiteSpace(extension)
            && options.AllowedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }

    private static bool HasBlockedExtension(string fileName, FileStorageOptions options)
    {
        var extension = Path.GetExtension(fileName);
        return !string.IsNullOrWhiteSpace(extension)
            && options.BlockedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }
}
