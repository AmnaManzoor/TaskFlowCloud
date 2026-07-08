using MediatR;

namespace TaskFlow.Application.Features.Attachments.Commands.DeleteAttachment;

public sealed record DeleteAttachmentCommand(
    string CurrentUserId,
    Guid AttachmentId) : IRequest;
