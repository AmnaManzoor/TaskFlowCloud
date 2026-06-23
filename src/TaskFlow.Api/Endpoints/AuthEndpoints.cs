using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Interfaces.Identity;

namespace TaskFlow.Api.Endpoints;

/// <summary>
/// Authentication and authorization HTTP endpoints.
/// </summary>
public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication");

        group.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .WithSummary("Register a new user account")
            .AddEndpointFilter<ValidationFilter<RegisterRequest>>()
            .AllowAnonymous();

        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .WithSummary("Authenticate with email and password")
            .AddEndpointFilter<ValidationFilter<LoginRequest>>()
            .AllowAnonymous();

        group.MapPost("/logout", LogoutAsync)
            .WithName("Logout")
            .WithSummary("Revoke the current refresh token")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapPost("/refresh-token", RefreshTokenAsync)
            .WithName("RefreshToken")
            .WithSummary("Rotate refresh token and issue a new access token")
            .AllowAnonymous();

        group.MapPost("/change-password", ChangePasswordAsync)
            .WithName("ChangePassword")
            .WithSummary("Change the authenticated user's password")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated)
            .AddEndpointFilter<ValidationFilter<ChangePasswordRequest>>();

        group.MapPost("/forgot-password", ForgotPasswordAsync)
            .WithName("ForgotPassword")
            .WithSummary("Request a password reset token")
            .AllowAnonymous();

        group.MapPost("/reset-password", ResetPasswordAsync)
            .WithName("ResetPassword")
            .WithSummary("Reset password using a reset token")
            .AllowAnonymous()
            .AddEndpointFilter<ValidationFilter<ResetPasswordRequest>>();

        group.MapPost("/verify-email", VerifyEmailAsync)
            .WithName("VerifyEmail")
            .WithSummary("Verify a user's email address")
            .AllowAnonymous();

        group.MapPost("/resend-verification", ResendVerificationAsync)
            .WithName("ResendVerification")
            .WithSummary("Resend email verification token")
            .AllowAnonymous();

        group.MapGet("/me", GetCurrentUserAsync)
            .WithName("GetCurrentUser")
            .WithSummary("Get the authenticated user's profile")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        IAuthService authService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var response = await authService.RegisterAsync(request, GetClientIp(httpContext), cancellationToken);
        return Results.Created("/api/auth/me", response);
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IAuthService authService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, GetClientIp(httpContext), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> LogoutAsync(
        LogoutRequest request,
        IAuthService authService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        var response = await authService.LogoutAsync(userId, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RefreshTokenAsync(
        RefreshTokenRequest request,
        IAuthService authService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var response = await authService.RefreshTokenAsync(request, GetClientIp(httpContext), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        IAuthService authService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        var response = await authService.ChangePasswordAsync(userId, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        IAuthService authService,
        CancellationToken cancellationToken)
    {
        var response = await authService.ForgotPasswordAsync(request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ResetPasswordAsync(
        ResetPasswordRequest request,
        IAuthService authService,
        CancellationToken cancellationToken)
    {
        var response = await authService.ResetPasswordAsync(request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> VerifyEmailAsync(
        VerifyEmailRequest request,
        IAuthService authService,
        CancellationToken cancellationToken)
    {
        var response = await authService.VerifyEmailAsync(request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ResendVerificationAsync(
        ResendVerificationRequest request,
        IAuthService authService,
        CancellationToken cancellationToken)
    {
        var response = await authService.ResendVerificationEmailAsync(request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetCurrentUserAsync(
        IAuthService authService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        var response = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");

    private static string? GetClientIp(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString();
}
