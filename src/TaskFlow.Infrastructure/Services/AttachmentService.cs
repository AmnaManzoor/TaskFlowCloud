using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Storage;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class AttachmentService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IFileStorageService fileStorageService,
    ICollaborationAccessService accessService,
    IOrganizationAccessService organizationAccessService,
    IAuditTriggerService auditTriggers,
    ILogger<AttachmentService> logger) : IAttachmentService
{
    public async Task<AttachmentResponse> UploadAsync(
        string currentUserId,
        Guid taskId,
        UploadAttachmentRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanUploadAttachmentsAsync(currentUserId, taskId, cancellationToken);
        _ = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(task => task.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        var stored = await fileStorageService.SaveAsync(
            taskId,
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(stored.ContentHash)
            && await dbContext.Attachments.AnyAsync(
                attachment => attachment.TaskId == taskId && attachment.ContentHash == stored.ContentHash,
                cancellationToken))
        {
            await fileStorageService.DeleteAsync(stored.RelativePath, cancellationToken);
            logger.LogWarning("Duplicate upload rejected for task {TaskId} by user {UserId}", taskId, currentUserId);
            throw new InvalidOperationException("An identical file has already been uploaded to this task.");
        }

        var sanitizedOriginalName = Path.GetFileName(request.FileName);
        var attachment = Attachment.Create(
            taskId,
            currentUserId,
            sanitizedOriginalName,
            stored.StoredFileName,
            stored.FileExtension,
            stored.ContentType,
            stored.FileSize,
            stored.RelativePath,
            stored.ContentHash);

        dbContext.Attachments.Add(attachment);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("File uploaded as attachment {AttachmentId} for task {TaskId} by user {UserId}", attachment.Id, taskId, currentUserId);
        await auditTriggers.LogAttachmentUploadedAsync(attachment.Id, taskId, currentUserId, cancellationToken);

        return await MapAttachmentAsync(attachment.Id, cancellationToken);
    }

    public async Task<AttachmentResponse> ReplaceAsync(
        string currentUserId,
        Guid attachmentId,
        UploadAttachmentRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanModifyAttachmentAsync(currentUserId, attachmentId, cancellationToken);

        var attachment = await dbContext.Attachments
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        var previousPath = attachment.FilePath;
        var stored = await fileStorageService.SaveAsync(
            attachment.TaskId,
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        attachment.ReplaceMetadata(
            Path.GetFileName(request.FileName),
            stored.StoredFileName,
            stored.FileExtension,
            stored.ContentType,
            stored.FileSize,
            stored.RelativePath,
            stored.ContentHash);

        await dbContext.SaveChangesAsync(cancellationToken);
        await fileStorageService.DeleteAsync(previousPath, cancellationToken);
        logger.LogInformation("Attachment {AttachmentId} replaced by user {UserId}", attachmentId, currentUserId);

        return await MapAttachmentAsync(attachmentId, cancellationToken);
    }

    public async Task<AttachmentResponse> GetByIdAsync(
        string currentUserId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanDownloadAttachmentAsync(currentUserId, attachmentId, cancellationToken);
        return await MapAttachmentAsync(attachmentId, cancellationToken);
    }

    public async Task<AttachmentDownloadResult> DownloadAsync(
        string currentUserId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await accessService.EnsureCanDownloadAttachmentAsync(currentUserId, attachmentId, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            logger.LogWarning("Unauthorized download attempt for attachment {AttachmentId} by user {UserId}", attachmentId, currentUserId);
            throw;
        }

        var attachment = await dbContext.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        var stream = await fileStorageService.OpenReadAsync(attachment.FilePath, cancellationToken);
        logger.LogInformation("Attachment {AttachmentId} downloaded by user {UserId}", attachmentId, currentUserId);

        return new AttachmentDownloadResult(stream, attachment.ContentType, attachment.OriginalFileName);
    }

    public async Task DeleteAsync(string currentUserId, Guid attachmentId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanModifyAttachmentAsync(currentUserId, attachmentId, cancellationToken);

        var attachment = await dbContext.Attachments
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        var filePath = attachment.FilePath;
        dbContext.Attachments.Remove(attachment);
        await dbContext.SaveChangesAsync(cancellationToken);
        await fileStorageService.DeleteAsync(filePath, cancellationToken);
        logger.LogInformation("Attachment {AttachmentId} deleted by user {UserId}", attachmentId, currentUserId);
        await auditTriggers.LogAttachmentDeletedAsync(attachmentId, currentUserId, cancellationToken);
    }

    public async Task<PagedResult<AttachmentResponse>> GetForTaskAsync(
        string currentUserId,
        Guid taskId,
        AttachmentListQuery query,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadTaskAsync(currentUserId, taskId, cancellationToken);

        var attachments = dbContext.Attachments
            .AsNoTracking()
            .Where(attachment => attachment.TaskId == taskId);

        return await ToPagedResultAsync(attachments, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    public async Task<PagedResult<AttachmentResponse>> SearchAsync(
        string currentUserId,
        AttachmentSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        var attachments = dbContext.Attachments.AsNoTracking().AsQueryable();

        if (query.TaskId.HasValue)
        {
            await accessService.EnsureCanReadTaskAsync(currentUserId, query.TaskId.Value, cancellationToken);
            attachments = attachments.Where(attachment => attachment.TaskId == query.TaskId.Value);
        }
        else
        {
            attachments = await FilterAccessibleAttachmentsAsync(currentUserId, attachments, cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(query.UserId))
        {
            attachments = attachments.Where(attachment => attachment.UploadedBy == query.UserId);
        }

        return await ToPagedResultAsync(attachments, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    private async Task<PagedResult<AttachmentResponse>> ToPagedResultAsync(
        IQueryable<Attachment> attachments,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken)
    {
        attachments = ApplySorting(attachments, sortBy, sortDescending);

        var totalCount = await attachments.CountAsync(cancellationToken);
        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var attachmentIds = await attachments
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(attachment => attachment.Id)
            .ToListAsync(cancellationToken);

        var items = new List<AttachmentResponse>();
        foreach (var attachmentId in attachmentIds)
        {
            items.Add(await MapAttachmentAsync(attachmentId, cancellationToken));
        }

        return new PagedResult<AttachmentResponse>(items, normalizedPage, normalizedPageSize, totalCount);
    }

    private async Task<AttachmentResponse> MapAttachmentAsync(Guid attachmentId, CancellationToken cancellationToken)
    {
        var attachment = await dbContext.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        var uploader = await userManager.FindByIdAsync(attachment.UploadedBy);

        return new AttachmentResponse(
            attachment.Id,
            attachment.TaskId,
            attachment.UploadedBy,
            uploader?.Email ?? string.Empty,
            attachment.OriginalFileName,
            attachment.FileExtension,
            attachment.ContentType,
            attachment.FileSize,
            fileStorageService.BuildDownloadUrl(attachment.Id),
            attachment.CreatedAt);
    }

    private async Task<IQueryable<Attachment>> FilterAccessibleAttachmentsAsync(
        string currentUserId,
        IQueryable<Attachment> attachments,
        CancellationToken cancellationToken)
    {
        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return attachments;
        }

        var adminOrganizationIds = dbContext.OrganizationMembers
            .Where(member =>
                member.UserId == currentUserId
                && (member.Role == Domain.Enums.OrganizationMemberRole.Owner
                    || member.Role == Domain.Enums.OrganizationMemberRole.Administrator))
            .Select(member => member.OrganizationId);

        var memberProjectIds = dbContext.ProjectMembers
            .Where(member => member.UserId == currentUserId)
            .Select(member => member.ProjectId);

        var accessibleProjectIds = dbContext.Projects
            .Where(project =>
                adminOrganizationIds.Contains(project.OrganizationId)
                || memberProjectIds.Contains(project.Id))
            .Select(project => project.Id);

        var accessibleTaskIds = dbContext.Tasks
            .Where(task => accessibleProjectIds.Contains(task.ProjectId))
            .Select(task => task.Id);

        return attachments.Where(attachment => accessibleTaskIds.Contains(attachment.TaskId));
    }

    private static IQueryable<Attachment> ApplySorting(
        IQueryable<Attachment> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "filename" => sortDescending
                ? query.OrderByDescending(attachment => attachment.OriginalFileName)
                : query.OrderBy(attachment => attachment.OriginalFileName),
            "filesize" => sortDescending
                ? query.OrderByDescending(attachment => attachment.FileSize)
                : query.OrderBy(attachment => attachment.FileSize),
            _ => sortDescending
                ? query.OrderByDescending(attachment => attachment.CreatedAt)
                : query.OrderBy(attachment => attachment.CreatedAt)
        };
}
