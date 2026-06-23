using System.Security.Claims;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Interfaces.Collaboration;

namespace TaskFlow.Api.Endpoints;

public static class AttachmentEndpoints
{
    public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder app)
    {
        var taskGroup = app.MapGroup("/api/tasks")
            .WithTags("Attachments")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        taskGroup.MapPost("/{taskId:guid}/attachments", UploadAsync)
            .DisableAntiforgery();

        taskGroup.MapGet("/{taskId:guid}/attachments", ListForTaskAsync);

        var attachmentGroup = app.MapGroup("/api/attachments")
            .WithTags("Attachments")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        attachmentGroup.MapGet("/search", SearchAsync);

        attachmentGroup.MapGet("/{id:guid}", GetByIdAsync);

        attachmentGroup.MapGet("/{id:guid}/download", DownloadAsync);

        attachmentGroup.MapDelete("/{id:guid}", DeleteAsync);

        attachmentGroup.MapPut("/{id:guid}", ReplaceAsync)
            .DisableAntiforgery();

        return app;
    }

    private static async Task<IResult> UploadAsync(
        Guid taskId,
        IFormFile file,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return Results.Problem(
                title: "Validation failed",
                detail: "A file is required.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        await using var stream = file.OpenReadStream();
        var request = new UploadAttachmentRequest(stream, file.FileName, file.ContentType, file.Length);

        var response = await service.UploadAsync(GetUserId(user), taskId, request, cancellationToken);
        return Results.Created($"/api/attachments/{response.Id}", response);
    }

    private static async Task<IResult> ListForTaskAsync(
        Guid taskId,
        [AsParameters] AttachmentListQuery query,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetForTaskAsync(GetUserId(user), taskId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> SearchAsync(
        [AsParameters] AttachmentSearchQuery query,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.SearchAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DownloadAsync(
        Guid id,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var result = await service.DownloadAsync(GetUserId(user), id, cancellationToken);
        return Results.File(result.FileStream, result.ContentType, result.FileName);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ReplaceAsync(
        Guid id,
        IFormFile file,
        IAttachmentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return Results.Problem(
                title: "Validation failed",
                detail: "A file is required.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        await using var stream = file.OpenReadStream();
        var request = new UploadAttachmentRequest(stream, file.FileName, file.ContentType, file.Length);
        var response = await service.ReplaceAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
