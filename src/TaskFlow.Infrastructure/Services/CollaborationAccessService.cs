using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Application.Interfaces.Tasks;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class CollaborationAccessService(
    ApplicationDbContext dbContext,
    ITaskAccessService taskAccessService,
    IProjectAccessService projectAccessService,
    IOrganizationAccessService organizationAccessService) : ICollaborationAccessService
{
    public Task EnsureCanReadTaskAsync(string userId, Guid taskId, CancellationToken cancellationToken = default) =>
        taskAccessService.EnsureCanReadTaskAsync(userId, taskId, cancellationToken);

    public async Task EnsureCanWriteCommentsAsync(string userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await EnsureNotViewerAsync(userId, taskId, cancellationToken);
    }

    public async Task EnsureCanModifyCommentAsync(string userId, Guid commentId, CancellationToken cancellationToken = default)
    {
        var comment = await dbContext.TaskComments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Comment not found.");

        if (comment.UserId == userId)
        {
            return;
        }

        if (await IsAdministratorForTaskAsync(userId, comment.TaskId, cancellationToken))
        {
            return;
        }

        throw new UnauthorizedAccessException("You do not have permission to modify this comment.");
    }

    public async Task EnsureCanUploadAttachmentsAsync(string userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await EnsureNotViewerAsync(userId, taskId, cancellationToken);
    }

    public async Task EnsureCanDownloadAttachmentAsync(string userId, Guid attachmentId, CancellationToken cancellationToken = default)
    {
        var attachment = await dbContext.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        try
        {
            await taskAccessService.EnsureCanReadTaskAsync(userId, attachment.TaskId, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            throw new UnauthorizedAccessException("You do not have permission to download this attachment.");
        }
    }

    public async Task EnsureCanModifyAttachmentAsync(string userId, Guid attachmentId, CancellationToken cancellationToken = default)
    {
        var attachment = await dbContext.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment not found.");

        if (attachment.UploadedBy == userId)
        {
            return;
        }

        if (await IsAdministratorForTaskAsync(userId, attachment.TaskId, cancellationToken))
        {
            return;
        }

        throw new UnauthorizedAccessException("You do not have permission to modify this attachment.");
    }

    private async Task EnsureNotViewerAsync(string userId, Guid taskId, CancellationToken cancellationToken)
    {
        if (await projectAccessService.IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var projectId = await taskAccessService.GetProjectIdAsync(taskId, cancellationToken);
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleAsync(entry => entry.Id == projectId, cancellationToken);

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await projectAccessService.GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || projectRole == ProjectRole.Viewer)
        {
            throw new UnauthorizedAccessException("Viewers have read-only access.");
        }
    }

    private async Task<bool> IsAdministratorForTaskAsync(
        string userId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        if (await projectAccessService.IsSuperAdminAsync(userId, cancellationToken))
        {
            return true;
        }

        var projectId = await taskAccessService.GetProjectIdAsync(taskId, cancellationToken);
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleAsync(entry => entry.Id == projectId, cancellationToken);

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return true;
        }

        var projectRole = await projectAccessService.GetProjectRoleAsync(userId, projectId, cancellationToken);
        return projectRole is not null && TaskRolePermissions.CanManageAllTasks(projectRole.Value);
    }
}
