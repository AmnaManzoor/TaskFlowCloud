using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Storage;

namespace TaskFlow.Application.Features.Attachments.Queries.DownloadAttachment;

public sealed class DownloadAttachmentQueryHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService,
    ICollaborationAccessService collaborationAccessService,
    ILogger<DownloadAttachmentQueryHandler> logger)
    : IRequestHandler<DownloadAttachmentQuery, AttachmentDownloadResult>
{
    public async Task<AttachmentDownloadResult> Handle(
        DownloadAttachmentQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            await collaborationAccessService.EnsureCanDownloadAttachmentAsync(
                query.CurrentUserId,
                query.AttachmentId,
                cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            logger.LogWarning(
                "Unauthorized download attempt for attachment {AttachmentId} by user {UserId}",
                query.AttachmentId,
                query.CurrentUserId);
            throw;
        }

        var attachment = await dbContext.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == query.AttachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        var stream = await fileStorageService.OpenReadAsync(attachment.BlobPath, cancellationToken);

        logger.LogInformation(
            "Attachment {AttachmentId} downloaded by user {UserId}",
            query.AttachmentId,
            query.CurrentUserId);

        return new AttachmentDownloadResult(stream, attachment.ContentType, attachment.OriginalFileName);
    }
}
