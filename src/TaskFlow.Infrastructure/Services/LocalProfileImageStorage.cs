using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Interfaces.Users;

namespace TaskFlow.Infrastructure.Services;

public sealed class LocalProfileImageStorage(
    IHostEnvironment hostEnvironment,
    IOptions<FileStorageOptions> options) : IProfileImageStorage
{
    private readonly FileStorageOptions _options = options.Value;

    public async Task<string> SaveAsync(
        string userId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        if (!allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Unsupported image file type.");
        }

        var directory = Path.Combine(hostEnvironment.ContentRootPath, _options.ProfileImagesPath);
        Directory.CreateDirectory(directory);

        var storedFileName = $"{userId}_{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(directory, storedFileName);

        await using var file = File.Create(physicalPath);
        await fileStream.CopyToAsync(file, cancellationToken);

        return $"{_options.ProfileImagesPublicPath.TrimEnd('/')}/{storedFileName}";
    }

    public Task DeleteAsync(string? imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return Task.CompletedTask;
        }

        var fileName = Path.GetFileName(imageUrl);
        var physicalPath = Path.Combine(hostEnvironment.ContentRootPath, _options.ProfileImagesPath, fileName);

        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }

        return Task.CompletedTask;
    }
}
