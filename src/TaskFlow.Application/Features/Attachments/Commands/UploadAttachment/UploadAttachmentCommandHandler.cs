using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Features.Attachments;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Storage;
using TaskFlow.Application.Interfaces.Users;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Features.Attachments.Commands.UploadAttachment;

public sealed class UploadAttachmentCommandHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService,
    ICollaborationAccessService collaborationAccessService,
    IUserManagementService userManagementService,
    ILogger<UploadAttachmentCommandHandler> logger)
    : IRequestHandler<UploadAttachmentCommand, AttachmentDto>
{
    public async Task<AttachmentDto> Handle(
        UploadAttachmentCommand command,
        CancellationToken cancellationToken)
    {
        await collaborationAccessService.EnsureCanUploadAttachmentsAsync(
            command.CurrentUserId,
            command.TaskId,
            cancellationToken);

        var taskExists = await dbContext.Tasks
            .AsNoTracking()
            .AnyAsync(task => task.Id == command.TaskId, cancellationToken);

        if (!taskExists)
        {
            throw new KeyNotFoundException("Task not found.");
        }

        var stored = await fileStorageService.SaveAsync(
            command.TaskId,
            command.FileStream,
            command.FileName,
            command.ContentType,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(stored.ContentHash)
            && await dbContext.Attachments.AnyAsync(
                attachment => attachment.TaskId == command.TaskId
                    && attachment.ContentHash == stored.ContentHash,
                cancellationToken))
        {
            await fileStorageService.DeleteAsync(stored.RelativePath, cancellationToken);
            logger.LogWarning(
                "Duplicate upload rejected for task {TaskId} by user {UserId}",
                command.TaskId,
                command.CurrentUserId);
            throw new InvalidOperationException("An identical file has already been uploaded to this task.");
        }

        var sanitizedOriginalName = Path.GetFileName(command.FileName);
        var attachment = Attachment.Create(
            command.TaskId,
            command.CurrentUserId,
            sanitizedOriginalName,
            stored.StoredFileName,
            stored.FileExtension,
            stored.ContentType,
            stored.FileSize,
            stored.RelativePath,
            stored.ContentHash);

        dbContext.Attachments.Add(attachment);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "File uploaded as attachment {AttachmentId} for task {TaskId} by user {UserId}",
            attachment.Id,
            command.TaskId,
            command.CurrentUserId);

        var uploader = await userManagementService.GetByIdAsync(
            command.CurrentUserId,
            command.CurrentUserId,
            cancellationToken);

        return new AttachmentDto(
            attachment.Id,
            attachment.TaskId,
            attachment.UploadedBy,
            uploader.Email,
            attachment.OriginalFileName,
            attachment.FileExtension,
            attachment.ContentType,
            attachment.FileSize,
            fileStorageService.BuildDownloadUrl(attachment.Id),
            attachment.CreatedAt);
    }
}
