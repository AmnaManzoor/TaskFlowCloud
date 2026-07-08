extern alias AzureIdentity;
using System.Security.Cryptography;
using System.Text;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DefaultAzureCredential = AzureIdentity::Azure.Identity.DefaultAzureCredential;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Interfaces.Storage;

namespace TaskFlow.Infrastructure.Services;

public sealed class AzureBlobStorageService : IFileStorageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly FileStorageOptions _fileStorageOptions;
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(
        IOptions<AzureBlobStorageOptions> azureOptions,
        IOptions<FileStorageOptions> fileStorageOptions,
        ILogger<AzureBlobStorageService> logger)
    {
        var options = azureOptions.Value;
        if (!options.IsConfigured)
        {
            throw new InvalidOperationException("Azure Blob Storage is not configured.");
        }

        _fileStorageOptions = fileStorageOptions.Value;
        _logger = logger;

        TokenCredential credential = new DefaultAzureCredential();
        var blobServiceClient = new BlobServiceClient(
            new Uri($"https://{options.AccountName}.blob.core.windows.net"),
            credential);
        _containerClient = blobServiceClient.GetBlobContainerClient(options.ContainerName);
        _containerClient.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<StoredFileResult> SaveAsync(
        Guid taskId,
        Stream fileStream,
        string originalFileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ValidateUpload(originalFileName, contentType, fileStream.CanSeek ? fileStream.Length : _fileStorageOptions.MaxAttachmentSizeBytes);

        var sanitizedExtension = GetSafeExtension(originalFileName);
        var storedFileName = $"{Guid.NewGuid():N}{sanitizedExtension}";
        var now = DateTimeOffset.UtcNow;
        var blobName = BuildBlobName(now.Year, now.Month, taskId, storedFileName);

        await using var buffer = new MemoryStream();
        using var sha256 = SHA256.Create();
        await using var cryptoStream = new CryptoStream(buffer, sha256, CryptoStreamMode.Write, leaveOpen: true);
        await fileStream.CopyToAsync(cryptoStream, cancellationToken);
        await cryptoStream.FlushFinalBlockAsync(cancellationToken);

        buffer.Position = 0;
        var blobClient = _containerClient.GetBlobClient(blobName);
        await blobClient.UploadAsync(
            buffer,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                },
            },
            cancellationToken);

        return new StoredFileResult(
            storedFileName,
            blobName,
            contentType,
            sanitizedExtension,
            buffer.Length,
            Convert.ToHexString(sha256.Hash!));
    }

    public async Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var blobName = NormalizeBlobName(relativePath);
        var blobClient = _containerClient.GetBlobClient(blobName);

        if (!await blobClient.ExistsAsync(cancellationToken))
        {
            throw new FileNotFoundException("Attachment file was not found.");
        }

        var response = await blobClient.DownloadStreamingAsync(cancellationToken: cancellationToken);
        return response.Value.Content;
    }

    public async Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var blobName = NormalizeBlobName(relativePath);
        var blobClient = _containerClient.GetBlobClient(blobName);
        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
    }

    public string BuildDownloadUrl(Guid attachmentId) => $"/api/attachments/{attachmentId}/download";

    private static string BuildBlobName(int year, int month, Guid taskId, string storedFileName) =>
        $"attachments/{year:D4}/{month:D2}/{taskId:D}/{storedFileName}";

    private static string NormalizeBlobName(string relativePath)
    {
        var normalized = relativePath.Replace('\\', '/').TrimStart('/');
        if (normalized.Contains("..", StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Invalid file path.");
        }

        return normalized;
    }

    private void ValidateUpload(string originalFileName, string contentType, long fileSize)
    {
        if (fileSize <= 0 || fileSize > _fileStorageOptions.MaxAttachmentSizeBytes)
        {
            _logger.LogWarning("Invalid upload attempt: file size {FileSize} bytes", fileSize);
            throw new InvalidOperationException(
                $"File size must be between 1 byte and {_fileStorageOptions.MaxAttachmentSizeBytes} bytes.");
        }

        var extension = GetSafeExtension(originalFileName);
        if (_fileStorageOptions.BlockedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Invalid upload attempt: blocked extension {Extension}", extension);
            throw new InvalidOperationException("Executable and script file types are not allowed.");
        }

        if (!_fileStorageOptions.AllowedAttachmentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Invalid upload attempt: disallowed extension {Extension}", extension);
            throw new InvalidOperationException("File extension is not allowed.");
        }

        if (!_fileStorageOptions.AllowedAttachmentContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Invalid upload attempt: disallowed content type {ContentType}", contentType);
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
}
