using MediatR;
using TaskFlow.Application.Features.Attachments;

namespace TaskFlow.Application.Features.Attachments.Commands.UploadAttachment;

public sealed record UploadAttachmentCommand(
    string CurrentUserId,
    Guid TaskId,
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSize) : IRequest<AttachmentDto>;
