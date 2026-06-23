using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Collaboration;

namespace TaskFlow.Application.Interfaces.Collaboration;

public interface ICollaborationAccessService
{
    Task EnsureCanReadTaskAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanWriteCommentsAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanModifyCommentAsync(string userId, Guid commentId, CancellationToken cancellationToken = default);

    Task EnsureCanUploadAttachmentsAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanDownloadAttachmentAsync(string userId, Guid attachmentId, CancellationToken cancellationToken = default);

    Task EnsureCanModifyAttachmentAsync(string userId, Guid attachmentId, CancellationToken cancellationToken = default);
}

public interface ICommentService
{
    Task<CommentResponse> CreateAsync(string currentUserId, Guid taskId, CreateCommentRequest request, CancellationToken cancellationToken = default);

    Task<CommentResponse> UpdateAsync(string currentUserId, Guid commentId, UpdateCommentRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid commentId, CancellationToken cancellationToken = default);

    Task<CommentResponse> ReplyAsync(string currentUserId, Guid commentId, ReplyCommentRequest request, CancellationToken cancellationToken = default);

    Task<CommentResponse> AddMentionsAsync(string currentUserId, Guid commentId, AddMentionsRequest request, CancellationToken cancellationToken = default);

    Task<CommentResponse> GetByIdAsync(string currentUserId, Guid commentId, CancellationToken cancellationToken = default);

    Task<CommentThreadResponse> GetThreadAsync(string currentUserId, Guid commentId, CancellationToken cancellationToken = default);

    Task<PagedResult<CommentResponse>> GetForTaskAsync(string currentUserId, Guid taskId, CommentListQuery query, CancellationToken cancellationToken = default);

    Task<PagedResult<CommentResponse>> SearchAsync(string currentUserId, CommentSearchQuery query, CancellationToken cancellationToken = default);
}

public interface IAttachmentService
{
    Task<AttachmentResponse> UploadAsync(string currentUserId, Guid taskId, UploadAttachmentRequest request, CancellationToken cancellationToken = default);

    Task<AttachmentResponse> ReplaceAsync(string currentUserId, Guid attachmentId, UploadAttachmentRequest request, CancellationToken cancellationToken = default);

    Task<AttachmentResponse> GetByIdAsync(string currentUserId, Guid attachmentId, CancellationToken cancellationToken = default);

    Task<AttachmentDownloadResult> DownloadAsync(string currentUserId, Guid attachmentId, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid attachmentId, CancellationToken cancellationToken = default);

    Task<PagedResult<AttachmentResponse>> GetForTaskAsync(string currentUserId, Guid taskId, AttachmentListQuery query, CancellationToken cancellationToken = default);

    Task<PagedResult<AttachmentResponse>> SearchAsync(string currentUserId, AttachmentSearchQuery query, CancellationToken cancellationToken = default);
}
