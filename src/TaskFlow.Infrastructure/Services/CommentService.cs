using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class CommentService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    ICollaborationAccessService accessService,
    IOrganizationAccessService organizationAccessService,
    INotificationTriggerService notificationTriggers,
    IAuditTriggerService auditTriggers,
    ILogger<CommentService> logger) : ICommentService
{
    public async Task<CommentResponse> CreateAsync(
        string currentUserId,
        Guid taskId,
        CreateCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanWriteCommentsAsync(currentUserId, taskId, cancellationToken);
        await EnsureTaskExistsAsync(taskId, cancellationToken);

        var comment = TaskComment.Create(taskId, currentUserId, request.Content.Trim());
        dbContext.TaskComments.Add(comment);

        if (request.MentionedUserIds is { Count: > 0 })
        {
            await AddMentionsInternalAsync(comment, taskId, request.MentionedUserIds, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Comment {CommentId} created on task {TaskId} by user {UserId}", comment.Id, taskId, currentUserId);

        await notificationTriggers.NotifyTaskCommentAddedAsync(taskId, comment.Id, currentUserId, cancellationToken);
        if (request.MentionedUserIds is { Count: > 0 })
        {
            await notificationTriggers.NotifyMentionedInCommentAsync(
                comment.Id,
                request.MentionedUserIds,
                currentUserId,
                cancellationToken);
        }

        await auditTriggers.LogCommentAddedAsync(comment.Id, taskId, currentUserId, cancellationToken);

        return await MapCommentAsync(comment.Id, cancellationToken);
    }

    public async Task<CommentResponse> UpdateAsync(
        string currentUserId,
        Guid commentId,
        UpdateCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanModifyCommentAsync(currentUserId, commentId, cancellationToken);

        var comment = await dbContext.TaskComments
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Comment not found.");

        var previousContent = comment.Content;
        comment.Edit(request.Content.Trim());
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Comment {CommentId} updated by user {UserId}", commentId, currentUserId);

        await auditTriggers.LogCommentEditedAsync(
            commentId,
            currentUserId,
            new { Content = previousContent },
            new { Content = request.Content.Trim() },
            cancellationToken);

        return await MapCommentAsync(commentId, cancellationToken);
    }

    public async Task DeleteAsync(string currentUserId, Guid commentId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanModifyCommentAsync(currentUserId, commentId, cancellationToken);

        var comment = await dbContext.TaskComments
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Comment not found.");

        comment.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Comment {CommentId} deleted by user {UserId}", commentId, currentUserId);
        await auditTriggers.LogCommentDeletedAsync(commentId, currentUserId, cancellationToken);
    }

    public async Task<CommentResponse> ReplyAsync(
        string currentUserId,
        Guid commentId,
        ReplyCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var parent = await dbContext.TaskComments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Parent comment not found.");

        await accessService.EnsureCanWriteCommentsAsync(currentUserId, parent.TaskId, cancellationToken);

        var reply = TaskComment.Create(parent.TaskId, currentUserId, request.Content.Trim(), commentId);
        dbContext.TaskComments.Add(reply);

        if (request.MentionedUserIds is { Count: > 0 })
        {
            await AddMentionsInternalAsync(reply, parent.TaskId, request.MentionedUserIds, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Reply {ReplyId} created for comment {CommentId} by user {UserId}", reply.Id, commentId, currentUserId);

        await notificationTriggers.NotifyTaskCommentAddedAsync(parent.TaskId, reply.Id, currentUserId, cancellationToken);
        if (request.MentionedUserIds is { Count: > 0 })
        {
            await notificationTriggers.NotifyMentionedInCommentAsync(
                reply.Id,
                request.MentionedUserIds,
                currentUserId,
                cancellationToken);
        }

        await auditTriggers.LogCommentAddedAsync(reply.Id, parent.TaskId, currentUserId, cancellationToken);

        return await MapCommentAsync(reply.Id, cancellationToken);
    }

    public async Task<CommentResponse> AddMentionsAsync(
        string currentUserId,
        Guid commentId,
        AddMentionsRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanModifyCommentAsync(currentUserId, commentId, cancellationToken);

        var comment = await dbContext.TaskComments
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Comment not found.");

        await AddMentionsInternalAsync(comment, comment.TaskId, request.MentionedUserIds, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        await notificationTriggers.NotifyMentionedInCommentAsync(
            commentId,
            request.MentionedUserIds,
            currentUserId,
            cancellationToken);

        return await MapCommentAsync(commentId, cancellationToken);
    }

    public async Task<CommentResponse> GetByIdAsync(
        string currentUserId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var taskId = await GetCommentTaskIdAsync(commentId, cancellationToken);
        await accessService.EnsureCanReadTaskAsync(currentUserId, taskId, cancellationToken);
        return await MapCommentAsync(commentId, cancellationToken);
    }

    public async Task<CommentThreadResponse> GetThreadAsync(
        string currentUserId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var taskId = await GetCommentTaskIdAsync(commentId, cancellationToken);
        await accessService.EnsureCanReadTaskAsync(currentUserId, taskId, cancellationToken);

        var root = await MapCommentAsync(commentId, cancellationToken);
        var replies = await dbContext.TaskComments
            .AsNoTracking()
            .Where(comment => comment.ParentCommentId == commentId)
            .OrderBy(comment => comment.CreatedAt)
            .Select(comment => comment.Id)
            .ToListAsync(cancellationToken);

        var replyResponses = new List<CommentResponse>();
        foreach (var replyId in replies)
        {
            replyResponses.Add(await MapCommentAsync(replyId, cancellationToken));
        }

        return new CommentThreadResponse(root, replyResponses);
    }

    public async Task<PagedResult<CommentResponse>> GetForTaskAsync(
        string currentUserId,
        Guid taskId,
        CommentListQuery query,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadTaskAsync(currentUserId, taskId, cancellationToken);

        var comments = dbContext.TaskComments
            .AsNoTracking()
            .Where(comment => comment.TaskId == taskId);

        if (!query.IncludeReplies)
        {
            comments = comments.Where(comment => comment.ParentCommentId == null);
        }

        return await ToPagedResultAsync(comments, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    public async Task<PagedResult<CommentResponse>> SearchAsync(
        string currentUserId,
        CommentSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        var comments = dbContext.TaskComments.AsNoTracking().AsQueryable();

        if (query.TaskId.HasValue)
        {
            await accessService.EnsureCanReadTaskAsync(currentUserId, query.TaskId.Value, cancellationToken);
            comments = comments.Where(comment => comment.TaskId == query.TaskId.Value);
        }
        else
        {
            comments = await FilterAccessibleCommentsAsync(currentUserId, comments, cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(query.UserId))
        {
            comments = comments.Where(comment => comment.UserId == query.UserId);
        }

        return await ToPagedResultAsync(comments, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    private async Task AddMentionsInternalAsync(
        TaskComment comment,
        Guid taskId,
        IReadOnlyList<string> mentionedUserIds,
        CancellationToken cancellationToken)
    {
        var projectId = await dbContext.Tasks
            .Where(task => task.Id == taskId)
            .Select(task => task.ProjectId)
            .SingleAsync(cancellationToken);

        var organizationId = await dbContext.Projects
            .Where(project => project.Id == projectId)
            .Select(project => project.OrganizationId)
            .SingleAsync(cancellationToken);

        foreach (var mentionedUserId in mentionedUserIds.Distinct(StringComparer.Ordinal))
        {
            var isMember = await dbContext.OrganizationMembers
                .AnyAsync(member => member.OrganizationId == organizationId && member.UserId == mentionedUserId, cancellationToken);

            if (!isMember)
            {
                throw new InvalidOperationException("Mentioned users must belong to the project's organization.");
            }

            if (await dbContext.Mentions.AnyAsync(
                    mention => mention.CommentId == comment.Id && mention.MentionedUserId == mentionedUserId,
                    cancellationToken))
            {
                continue;
            }

            dbContext.Mentions.Add(Mention.Create(comment.Id, mentionedUserId));
        }
    }

    private async Task<PagedResult<CommentResponse>> ToPagedResultAsync(
        IQueryable<TaskComment> comments,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken)
    {
        comments = ApplySorting(comments, sortBy, sortDescending);

        var totalCount = await comments.CountAsync(cancellationToken);
        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var commentIds = await comments
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(comment => comment.Id)
            .ToListAsync(cancellationToken);

        var items = new List<CommentResponse>();
        foreach (var commentId in commentIds)
        {
            items.Add(await MapCommentAsync(commentId, cancellationToken));
        }

        return new PagedResult<CommentResponse>(items, normalizedPage, normalizedPageSize, totalCount);
    }

    private async Task<CommentResponse> MapCommentAsync(Guid commentId, CancellationToken cancellationToken)
    {
        var comment = await dbContext.TaskComments
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Comment not found.");

        var author = await userManager.FindByIdAsync(comment.UserId);
        var replyCount = await dbContext.TaskComments.CountAsync(entry => entry.ParentCommentId == commentId, cancellationToken);

        var mentions = await dbContext.Mentions
            .AsNoTracking()
            .Where(mention => mention.CommentId == commentId)
            .ToListAsync(cancellationToken);

        var mentionUserIds = mentions.Select(mention => mention.MentionedUserId).ToList();
        var mentionUsers = await userManager.Users
            .Where(user => mentionUserIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var mentionResponses = mentions
            .Where(mention => mentionUsers.ContainsKey(mention.MentionedUserId))
            .Select(mention =>
            {
                var user = mentionUsers[mention.MentionedUserId];
                return new MentionResponse(
                    mention.Id,
                    mention.MentionedUserId,
                    user.Email!,
                    user.FirstName,
                    user.LastName);
            })
            .ToList();

        return new CommentResponse(
            comment.Id,
            comment.TaskId,
            comment.UserId,
            author?.Email ?? string.Empty,
            author?.FirstName ?? string.Empty,
            author?.LastName ?? string.Empty,
            comment.ParentCommentId,
            comment.IsDeleted ? TaskComment.DeletedPlaceholder : comment.Content,
            comment.IsEdited,
            comment.EditedAt,
            comment.IsDeleted,
            comment.CreatedAt,
            comment.UpdatedAt,
            mentionResponses,
            replyCount);
    }

    private async Task<IQueryable<TaskComment>> FilterAccessibleCommentsAsync(
        string currentUserId,
        IQueryable<TaskComment> comments,
        CancellationToken cancellationToken)
    {
        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return comments;
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

        return comments.Where(comment => accessibleTaskIds.Contains(comment.TaskId));
    }

    private async Task<Guid> GetCommentTaskIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        var taskId = await dbContext.TaskComments
            .AsNoTracking()
            .Where(comment => comment.Id == commentId)
            .Select(comment => comment.TaskId)
            .SingleOrDefaultAsync(cancellationToken);

        if (taskId == Guid.Empty)
        {
            throw new KeyNotFoundException("Comment not found.");
        }

        return taskId;
    }

    private async Task EnsureTaskExistsAsync(Guid taskId, CancellationToken cancellationToken)
    {
        _ = await dbContext.Tasks
            .AsNoTracking()
            .SingleOrDefaultAsync(task => task.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");
    }

    private static IQueryable<TaskComment> ApplySorting(
        IQueryable<TaskComment> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "updatedat" => sortDescending
                ? query.OrderByDescending(comment => comment.UpdatedAt)
                : query.OrderBy(comment => comment.UpdatedAt),
            _ => sortDescending
                ? query.OrderByDescending(comment => comment.CreatedAt)
                : query.OrderBy(comment => comment.CreatedAt)
        };
}
