using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Interfaces.Storage;

namespace TaskFlow.Infrastructure.Services;

public sealed class LocalFileStorageService(
    IHostEnvironment hostEnvironment,
    IOptions<FileStorageOptions> options,
    ILogger<LocalFileStorageService> logger) : IFileStorageService
{
    private readonly FileStorageOptions _options = options.Value;

    public async Task<StoredFileResult> SaveAsync(
        Guid taskId,
        Stream fileStream,
        string originalFileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ValidateUpload(originalFileName, contentType, fileStream.CanSeek ? fileStream.Length : _options.MaxAttachmentSizeBytes);

        var sanitizedExtension = GetSafeExtension(originalFileName);
        var storedFileName = $"{Guid.NewGuid():N}{sanitizedExtension}";
        var now = DateTimeOffset.UtcNow;
        var relativeDirectory = Path.Combine(
            _options.AttachmentsPath,
            now.Year.ToString("D4"),
            now.Month.ToString("D2"),
            taskId.ToString("D"));

        var absoluteDirectory = Path.Combine(hostEnvironment.ContentRootPath, relativeDirectory);
        Directory.CreateDirectory(absoluteDirectory);

        var absolutePath = Path.Combine(absoluteDirectory, storedFileName);
        var relativePath = Path.Combine(relativeDirectory, storedFileName).Replace('\\', '/');

        await using var output = File.Create(absolutePath);
        using var sha256 = SHA256.Create();
        await using var cryptoStream = new CryptoStream(output, sha256, CryptoStreamMode.Write);
        await fileStream.CopyToAsync(cryptoStream, cancellationToken);
        await cryptoStream.FlushFinalBlockAsync(cancellationToken);
        output.Flush();

        var fileSize = new FileInfo(absolutePath).Length;
        var hash = Convert.ToHexString(sha256.Hash!);

        return new StoredFileResult(
            storedFileName,
            relativePath,
            contentType,
            sanitizedExtension,
            fileSize,
            hash);
    }

    public Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var absolutePath = ResolveSafePath(relativePath);
        if (!File.Exists(absolutePath))
        {
            throw new FileNotFoundException("Attachment file was not found.");
        }

        Stream stream = File.OpenRead(absolutePath);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var absolutePath = ResolveSafePath(relativePath);
        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }

        return Task.CompletedTask;
    }

    public string BuildDownloadUrl(Guid attachmentId) => $"/api/attachments/{attachmentId}/download";

    private void ValidateUpload(string originalFileName, string contentType, long fileSize)
    {
        if (fileSize <= 0 || fileSize > _options.MaxAttachmentSizeBytes)
        {
            logger.LogWarning("Invalid upload attempt: file size {FileSize} bytes", fileSize);
            throw new InvalidOperationException(
                $"File size must be between 1 byte and {_options.MaxAttachmentSizeBytes} bytes.");
        }

        var extension = GetSafeExtension(originalFileName);
        if (_options.BlockedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            logger.LogWarning("Invalid upload attempt: blocked extension {Extension}", extension);
            throw new InvalidOperationException("Executable and script file types are not allowed.");
        }

        if (!_options.AllowedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            logger.LogWarning("Invalid upload attempt: disallowed extension {Extension}", extension);
            throw new InvalidOperationException("File extension is not allowed.");
        }

        if (!_options.AllowedAttachmentContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            logger.LogWarning("Invalid upload attempt: disallowed content type {ContentType}", contentType);
            throw new InvalidOperationException("Content type is not allowed.");
        }
    }

    private static string GetSafeExtension(string fileName)
    {
        var extension = Path.GetExtension(SanitizeFileName(fileName));
        return string.IsNullOrWhiteSpace(extension) ? string.Empty : extension.ToLowerInvariant();
    }

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        var builder = new StringBuilder(name.Length);

        foreach (var character in name)
        {
            builder.Append(char.IsLetterOrDigit(character) || character is '.' or '-' or '_' ? character : '_');
        }

        return builder.ToString();
    }

    private string ResolveSafePath(string relativePath)
    {
        var normalizedRelative = relativePath.Replace('\\', '/').TrimStart('/');
        if (normalizedRelative.Contains("..", StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Invalid file path.");
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, _options.AttachmentsPath));
        var absolutePath = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, normalizedRelative));

        if (!absolutePath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Invalid file path.");
        }

        return absolutePath;
    }
}
