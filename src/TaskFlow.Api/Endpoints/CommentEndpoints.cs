using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.Interfaces.Collaboration;

namespace TaskFlow.Api.Endpoints;

public static class CommentEndpoints
{
    public static IEndpointRouteBuilder MapCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var taskGroup = app.MapGroup("/api/tasks")
            .WithTags("Comments")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        taskGroup.MapPost("/{taskId:guid}/comments", CreateCommentAsync)
            .AddEndpointFilter<ValidationFilter<CreateCommentRequest>>();

        taskGroup.MapGet("/{taskId:guid}/comments", GetCommentsForTaskAsync);

        var commentGroup = app.MapGroup("/api/comments")
            .WithTags("Comments")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        commentGroup.MapGet("/search", SearchCommentsAsync);

        commentGroup.MapGet("/{id:guid}", GetCommentByIdAsync);

        commentGroup.MapGet("/{id:guid}/thread", GetThreadAsync);

        commentGroup.MapPut("/{id:guid}", UpdateCommentAsync)
            .AddEndpointFilter<ValidationFilter<UpdateCommentRequest>>();

        commentGroup.MapDelete("/{id:guid}", DeleteCommentAsync);

        commentGroup.MapPost("/{id:guid}/reply", ReplyAsync)
            .AddEndpointFilter<ValidationFilter<ReplyCommentRequest>>();

        commentGroup.MapPost("/{id:guid}/mentions", AddMentionsAsync)
            .AddEndpointFilter<ValidationFilter<AddMentionsRequest>>();

        return app;
    }

    private static async Task<IResult> CreateCommentAsync(
        Guid taskId,
        CreateCommentRequest request,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateAsync(GetUserId(user), taskId, request, cancellationToken);
        return Results.Created($"/api/comments/{response.Id}", response);
    }

    private static async Task<IResult> GetCommentsForTaskAsync(
        Guid taskId,
        [AsParameters] CommentListQuery query,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetForTaskAsync(GetUserId(user), taskId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> SearchCommentsAsync(
        [AsParameters] CommentSearchQuery query,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.SearchAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetCommentByIdAsync(
        Guid id,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetThreadAsync(
        Guid id,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetThreadAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateCommentAsync(
        Guid id,
        UpdateCommentRequest request,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteCommentAsync(
        Guid id,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ReplyAsync(
        Guid id,
        ReplyCommentRequest request,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ReplyAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/comments/{response.Id}", response);
    }

    private static async Task<IResult> AddMentionsAsync(
        Guid id,
        AddMentionsRequest request,
        ICommentService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AddMentionsAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
