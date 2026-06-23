namespace TaskFlow.Application.DTOs.Collaboration;

public sealed record CreateCommentRequest(
    string Content,
    IReadOnlyList<string>? MentionedUserIds = null);

public sealed record UpdateCommentRequest(string Content);

public sealed record ReplyCommentRequest(
    string Content,
    IReadOnlyList<string>? MentionedUserIds = null);

public sealed record AddMentionsRequest(IReadOnlyList<string> MentionedUserIds);

public sealed record MentionResponse(
    Guid Id,
    string MentionedUserId,
    string Email,
    string FirstName,
    string LastName);

public sealed record CommentResponse(
    Guid Id,
    Guid TaskId,
    string UserId,
    string AuthorEmail,
    string AuthorFirstName,
    string AuthorLastName,
    Guid? ParentCommentId,
    string Content,
    bool IsEdited,
    DateTimeOffset? EditedAt,
    bool IsDeleted,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<MentionResponse>? Mentions = null,
    int ReplyCount = 0);

public sealed record CommentThreadResponse(
    CommentResponse Root,
    IReadOnlyList<CommentResponse> Replies);

public sealed record CommentListQuery(
    int Page = 1,
    int PageSize = 50,
    string? SortBy = "createdAt",
    bool SortDescending = false,
    bool IncludeReplies = true);

public sealed record CommentSearchQuery(
    int Page = 1,
    int PageSize = 50,
    Guid? TaskId = null,
    string? UserId = null,
    string? SortBy = "createdAt",
    bool SortDescending = false);

public sealed record UploadAttachmentRequest(
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSize);

public sealed record AttachmentResponse(
    Guid Id,
    Guid TaskId,
    string UploadedBy,
    string UploaderEmail,
    string OriginalFileName,
    string FileExtension,
    string ContentType,
    long FileSize,
    string DownloadUrl,
    DateTimeOffset CreatedAt);

public sealed record AttachmentDownloadResult(
    Stream FileStream,
    string ContentType,
    string FileName);

public sealed record AttachmentListQuery(
    int Page = 1,
    int PageSize = 20,
    string? SortBy = "createdAt",
    bool SortDescending = true);

public sealed record AttachmentSearchQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? TaskId = null,
    string? UserId = null,
    string? SortBy = "createdAt",
    bool SortDescending = true);
