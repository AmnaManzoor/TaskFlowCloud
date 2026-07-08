using MediatR;
using TaskFlow.Application.DTOs.Collaboration;

namespace TaskFlow.Application.Features.Attachments.Queries.DownloadAttachment;

public sealed record DownloadAttachmentQuery(
    string CurrentUserId,
    Guid AttachmentId) : IRequest<AttachmentDownloadResult>;
