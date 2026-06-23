namespace TaskFlow.Application.Interfaces.Storage;

public sealed record StoredFileResult(
    string StoredFileName,
    string RelativePath,
    string ContentType,
    string FileExtension,
    long FileSize,
    string? ContentHash);

public interface IFileStorageService
{
    Task<StoredFileResult> SaveAsync(
        Guid taskId,
        Stream fileStream,
        string originalFileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default);

    Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);

    string BuildDownloadUrl(Guid attachmentId);
}
