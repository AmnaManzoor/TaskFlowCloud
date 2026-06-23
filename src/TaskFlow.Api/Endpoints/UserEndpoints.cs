using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Users;
using TaskFlow.Application.Interfaces.Users;

namespace TaskFlow.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapGet("/me", GetCurrentUserAsync);

        group.MapGet("/", GetAllAsync);

        group.MapGet("/{id}", GetByIdAsync);

        group.MapPut("/{id}", UpdateProfileAsync)
            .AddEndpointFilter<ValidationFilter<UpdateUserProfileRequest>>();

        group.MapPost("/{id}/activate", ActivateAsync);

        group.MapPost("/{id}/deactivate", DeactivateAsync);

        group.MapPost("/{id}/lock", LockAsync);

        group.MapPost("/{id}/unlock", UnlockAsync);

        group.MapPost("/{id}/profile-image", UploadProfileImageAsync)
            .DisableAntiforgery();

        group.MapDelete("/{id}/profile-image", DeleteProfileImageAsync);

        return app;
    }

    private static async Task<IResult> GetCurrentUserAsync(
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetCurrentUserAsync(GetUserId(user), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetAllAsync(
        [AsParameters] UserListQuery query,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetAllAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateProfileAsync(
        string id,
        UpdateUserProfileRequest request,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateProfileAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ActivateAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.ActivateAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(new { message = "User activated successfully." });
    }

    private static async Task<IResult> DeactivateAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeactivateAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(new { message = "User deactivated successfully." });
    }

    private static async Task<IResult> LockAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.LockAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(new { message = "User locked successfully." });
    }

    private static async Task<IResult> UnlockAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.UnlockAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(new { message = "User unlocked successfully." });
    }

    private static async Task<IResult> UploadProfileImageAsync(
        string id,
        IFormFile file,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return Results.BadRequest(new { message = "No file uploaded." });
        }

        await using var stream = file.OpenReadStream();
        var imageUrl = await service.UploadProfileImageAsync(
            GetUserId(user),
            id,
            stream,
            file.FileName,
            cancellationToken);

        return Results.Ok(new { profileImageUrl = imageUrl });
    }

    private static async Task<IResult> DeleteProfileImageAsync(
        string id,
        IUserManagementService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteProfileImageAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
