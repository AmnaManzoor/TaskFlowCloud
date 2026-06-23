using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.Interfaces.Audit;

namespace TaskFlow.Api.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var auditGroup = app.MapGroup("/api/auditlogs")
            .WithTags("Audit Logs")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        auditGroup.MapGet("/", SearchAuditLogsAsync)
            .AddEndpointFilter<ValidationFilter<AuditLogListQuery>>()
            .WithSummary("Search audit logs")
            .WithDescription("Returns paginated audit logs. Requires SuperAdmin, Admin, or Organization Owner.");

        auditGroup.MapGet("/{id:guid}", GetAuditLogByIdAsync)
            .WithSummary("Get audit log by ID");

        auditGroup.MapGet("/entity/{entityType}/{entityId:guid}", GetAuditLogsByEntityAsync)
            .AddEndpointFilter<ValidationFilter<AuditLogListQuery>>()
            .WithSummary("Get audit logs for an entity");

        auditGroup.MapGet("/user/{userId}", GetAuditLogsByUserAsync)
            .AddEndpointFilter<ValidationFilter<AuditLogListQuery>>()
            .WithSummary("Get audit logs for a user");

        var activityGroup = app.MapGroup("/api/activity")
            .WithTags("Activity History")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        activityGroup.MapGet("/", GetMyActivityAsync)
            .AddEndpointFilter<ValidationFilter<ActivityHistoryListQuery>>()
            .WithSummary("Get my activity history");

        activityGroup.MapGet("/user/{userId}", GetActivityByUserAsync)
            .AddEndpointFilter<ValidationFilter<ActivityHistoryListQuery>>()
            .WithSummary("Get activity history for a user");

        activityGroup.MapGet("/project/{projectId:guid}", GetActivityByProjectAsync)
            .AddEndpointFilter<ValidationFilter<ActivityHistoryListQuery>>()
            .WithSummary("Get activity history for a project");

        return app;
    }

    private static async Task<IResult> SearchAuditLogsAsync(
        [AsParameters] AuditLogListQuery query,
        IAuditLogService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.SearchAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetAuditLogByIdAsync(
        Guid id,
        IAuditLogService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetAuditLogsByEntityAsync(
        string entityType,
        Guid entityId,
        [AsParameters] AuditLogListQuery query,
        IAuditLogService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByEntityAsync(GetUserId(user), entityType, entityId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetAuditLogsByUserAsync(
        string userId,
        [AsParameters] AuditLogListQuery query,
        IAuditLogService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByUserAsync(GetUserId(user), userId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetMyActivityAsync(
        [AsParameters] ActivityHistoryListQuery query,
        IActivityHistoryService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetMyActivityAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetActivityByUserAsync(
        string userId,
        [AsParameters] ActivityHistoryListQuery query,
        IActivityHistoryService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByUserAsync(GetUserId(user), userId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetActivityByProjectAsync(
        Guid projectId,
        [AsParameters] ActivityHistoryListQuery query,
        IActivityHistoryService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByProjectAsync(GetUserId(user), projectId, query, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
