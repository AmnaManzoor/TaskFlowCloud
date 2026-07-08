namespace TaskFlow.Application.Features.Attachments;

public sealed record AttachmentDto(
    Guid Id,
    Guid TaskId,
    string UploadedBy,
    string UploaderEmail,
    string OriginalFileName,
    string FileExtension,
    string ContentType,
    long FileSize,
    string DownloadUrl,
    DateTimeOffset CreatedAt);
