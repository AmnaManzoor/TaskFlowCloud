using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Storage;

namespace TaskFlow.Application.Features.Attachments.Commands.DeleteAttachment;

public sealed class DeleteAttachmentCommandHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService,
    ICollaborationAccessService collaborationAccessService,
    IAuditTriggerService auditTriggerService,
    ILogger<DeleteAttachmentCommandHandler> logger) : IRequestHandler<DeleteAttachmentCommand>
{
    public async Task Handle(DeleteAttachmentCommand command, CancellationToken cancellationToken)
    {
        await collaborationAccessService.EnsureCanModifyAttachmentAsync(
            command.CurrentUserId,
            command.AttachmentId,
            cancellationToken);

        var attachment = await dbContext.Attachments
            .SingleOrDefaultAsync(entry => entry.Id == command.AttachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        // Keep consistency across storage + metadata: only delete SQL after blob deletion succeeds.
        await fileStorageService.DeleteAsync(attachment.BlobPath, cancellationToken);

        dbContext.Attachments.Remove(attachment);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Attachment {AttachmentId} deleted by user {UserId}",
            command.AttachmentId,
            command.CurrentUserId);

        await auditTriggerService.LogAttachmentDeletedAsync(
            command.AttachmentId,
            command.CurrentUserId,
            cancellationToken);
    }
}
