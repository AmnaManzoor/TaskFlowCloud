using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Interfaces.Projects;

namespace TaskFlow.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .WithTags("Projects")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapPost("/", CreateAsync)
            .AddEndpointFilter<ValidationFilter<CreateProjectRequest>>();

        group.MapGet("/", GetAllAsync);

        group.MapGet("/search", SearchAsync);

        group.MapGet("/{id:guid}", GetByIdAsync);

        group.MapPut("/{id:guid}", UpdateAsync)
            .AddEndpointFilter<ValidationFilter<UpdateProjectRequest>>();

        group.MapDelete("/{id:guid}", DeleteAsync);

        group.MapPost("/{id:guid}/archive", ArchiveAsync);

        group.MapPost("/{id:guid}/restore", RestoreAsync);

        group.MapPost("/{id:guid}/transfer-owner", TransferOwnershipAsync)
            .AddEndpointFilter<ValidationFilter<TransferProjectOwnershipRequest>>();

        group.MapPatch("/{id:guid}/status", ChangeStatusAsync)
            .AddEndpointFilter<ValidationFilter<ChangeProjectStatusRequest>>();

        group.MapPatch("/{id:guid}/priority", ChangePriorityAsync)
            .AddEndpointFilter<ValidationFilter<ChangeProjectPriorityRequest>>();

        group.MapPost("/{id:guid}/members", AddMemberAsync)
            .AddEndpointFilter<ValidationFilter<AddProjectMemberRequest>>();

        group.MapPut("/{id:guid}/members/{userId}", UpdateMemberRoleAsync)
            .AddEndpointFilter<ValidationFilter<UpdateProjectMemberRoleRequest>>();

        group.MapDelete("/{id:guid}/members/{userId}", RemoveMemberAsync);

        group.MapGet("/{id:guid}/members", GetMembersAsync);

        return app;
    }

    private static async Task<IResult> CreateAsync(
        CreateProjectRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateAsync(GetUserId(user), request, cancellationToken);
        return Results.Created($"/api/projects/{response.Id}", response);
    }

    private static async Task<IResult> GetAllAsync(
        [AsParameters] ProjectListQuery query,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetAllAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> SearchAsync(
        [AsParameters] ProjectSearchQuery query,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.SearchAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateProjectRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ArchiveAsync(
        Guid id,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ArchiveAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RestoreAsync(
        Guid id,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.RestoreAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> TransferOwnershipAsync(
        Guid id,
        TransferProjectOwnershipRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.TransferOwnershipAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ChangeStatusAsync(
        Guid id,
        ChangeProjectStatusRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ChangeStatusAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ChangePriorityAsync(
        Guid id,
        ChangeProjectPriorityRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ChangePriorityAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> AddMemberAsync(
        Guid id,
        AddProjectMemberRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AddMemberAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/projects/{id}/members/{response.UserId}", response);
    }

    private static async Task<IResult> UpdateMemberRoleAsync(
        Guid id,
        string userId,
        UpdateProjectMemberRoleRequest request,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateMemberRoleAsync(GetUserId(user), id, userId, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RemoveMemberAsync(
        Guid id,
        string userId,
        IProjectService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.RemoveMemberAsync(GetUserId(user), id, userId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetMembersAsync(
        Guid id,
        IProjectService service,
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
