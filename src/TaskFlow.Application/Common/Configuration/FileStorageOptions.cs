namespace TaskFlow.Application.Common.Configuration;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string ProfileImagesPath { get; init; } = "uploads/profiles";

    public string ProfileImagesPublicPath { get; init; } = "/uploads/profiles";

    public long MaxProfileImageSizeBytes { get; init; } = 5 * 1024 * 1024;

    public string AttachmentsPath { get; init; } = "wwwroot/uploads";

    public long MaxAttachmentSizeBytes { get; init; } = 25 * 1024 * 1024;

    public string[] AllowedAttachmentExtensions { get; init; } =
    [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip"
    ];

    public string[] AllowedAttachmentContentTypes { get; init; } =
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "application/zip",
        "application/x-zip-compressed"
    ];

    public string[] BlockedAttachmentExtensions { get; init; } =
    [
        ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".js", ".vbs", ".com"
    ];
}
