using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Domain.Constants;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.Interfaces.Notifications;

namespace TaskFlow.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapGet("/", GetMyNotificationsAsync)
            .AddEndpointFilter<ValidationFilter<NotificationListQuery>>();

        group.MapGet("/unread", GetUnreadAsync)
            .AddEndpointFilter<ValidationFilter<NotificationListQuery>>();

        group.MapGet("/count", GetUnreadCountAsync);

        group.MapGet("/{id:guid}", GetByIdAsync);

        group.MapPatch("/{id:guid}/read", MarkAsReadAsync);

        group.MapPatch("/{id:guid}/unread", MarkAsUnreadAsync);

        group.MapPatch("/read-all", MarkAllAsReadAsync);

        group.MapDelete("/{id:guid}", DeleteAsync);

        group.MapDelete("/read", DeleteAllReadAsync);

        return app;
    }

    private static async Task<IResult> GetMyNotificationsAsync(
        [AsParameters] NotificationListQuery query,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetMyNotificationsAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetUnreadAsync(
        [AsParameters] NotificationListQuery query,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetUnreadAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetUnreadCountAsync(
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetUnreadCountAsync(GetUserId(user), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var isSuperAdmin = user.IsInRole(ApplicationRoles.SuperAdmin);
        var response = await service.GetByIdAsync(GetUserId(user), id, isSuperAdmin, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> MarkAsReadAsync(
        Guid id,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.MarkAsReadAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> MarkAsUnreadAsync(
        Guid id,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.MarkAsUnreadAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> MarkAllAsReadAsync(
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var count = await service.MarkAllAsReadAsync(GetUserId(user), cancellationToken);
        return Results.Ok(new { count });
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteAllReadAsync(
        INotificationService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var count = await service.DeleteAllReadAsync(GetUserId(user), cancellationToken);
        return Results.Ok(new { count });
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
