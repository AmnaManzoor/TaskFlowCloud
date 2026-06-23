using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Teams;
using TaskFlow.Application.Interfaces.Organizations;

namespace TaskFlow.Api.Endpoints;

public static class TeamEndpoints
{
    public static IEndpointRouteBuilder MapTeamEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/teams")
            .WithTags("Teams")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapPost("/", CreateAsync)
            .AddEndpointFilter<ValidationFilter<CreateTeamRequest>>();

        group.MapGet("/", GetAllAsync);

        group.MapGet("/{id:guid}", GetByIdAsync);

        group.MapPut("/{id:guid}", UpdateAsync)
            .AddEndpointFilter<ValidationFilter<UpdateTeamRequest>>();

        group.MapDelete("/{id:guid}", DeleteAsync);

        group.MapPost("/{id:guid}/members", AddMemberAsync)
            .AddEndpointFilter<ValidationFilter<AddTeamMemberRequest>>();

        group.MapDelete("/{id:guid}/members/{userId}", RemoveMemberAsync);

        group.MapGet("/{id:guid}/members", GetMembersAsync);

        return app;
    }

    private static async Task<IResult> CreateAsync(
        CreateTeamRequest request,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateAsync(GetUserId(user), request, cancellationToken);
        return Results.Created($"/api/teams/{response.Id}", response);
    }

    private static async Task<IResult> GetAllAsync(
        [AsParameters] TeamListQuery query,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetAllAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateTeamRequest request,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AddMemberAsync(
        Guid id,
        AddTeamMemberRequest request,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AddMemberAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/teams/{id}/members/{response.UserId}", response);
    }

    private static async Task<IResult> RemoveMemberAsync(
        Guid id,
        string userId,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.RemoveMemberAsync(GetUserId(user), id, userId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetMembersAsync(
        Guid id,
        ITeamService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetMembersAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
