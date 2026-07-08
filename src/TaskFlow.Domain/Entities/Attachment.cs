namespace TaskFlow.Domain.Entities;

public sealed class Attachment
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TaskId { get; private set; }

    public string UploadedBy { get; private set; } = string.Empty;

    public string OriginalFileName { get; private set; } = string.Empty;

    public string StoredFileName { get; private set; } = string.Empty;

    public string FileExtension { get; private set; } = string.Empty;

    public string ContentType { get; private set; } = string.Empty;

    public long FileSize { get; private set; }

    public string BlobPath { get; private set; } = string.Empty;

    public string? ContentHash { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public TaskItem Task { get; private set; } = null!;

    private Attachment()
    {
    }

    public static Attachment Create(
        Guid taskId,
        string uploadedBy,
        string originalFileName,
        string storedFileName,
        string fileExtension,
        string contentType,
        long fileSize,
        string blobPath,
        string? contentHash)
    {
        return new Attachment
        {
            TaskId = taskId,
            UploadedBy = uploadedBy,
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            FileExtension = fileExtension,
            ContentType = contentType,
            FileSize = fileSize,
            BlobPath = blobPath,
            ContentHash = contentHash,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void ReplaceMetadata(
        string originalFileName,
        string storedFileName,
        string fileExtension,
        string contentType,
        long fileSize,
        string blobPath,
        string? contentHash)
    {
        OriginalFileName = originalFileName;
        StoredFileName = storedFileName;
        FileExtension = fileExtension;
        ContentType = contentType;
        FileSize = fileSize;
        BlobPath = blobPath;
        ContentHash = contentHash;
    }
}
