using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.Interfaces.Identity;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;

namespace TaskFlow.Infrastructure.Identity;

/// <summary>
/// Implements authentication and account management using ASP.NET Core Identity.
/// </summary>
public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ITokenService tokenService,
    IRefreshTokenService refreshTokenService,
    IAuditTriggerService auditTriggers,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request,
        string? clientIp,
        CancellationToken cancellationToken = default)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            EmailConfirmed = false
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", createResult.Errors.Select(error => error.Description)));
        }

        await userManager.AddToRoleAsync(user, ApplicationRoles.Member);

        var emailToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
        _ = emailToken;
        logger.LogInformation(
            "Simulated verification email sent to {Email}. Token generated for user {UserId}.",
            user.Email,
            user.Id);

        var response = await CreateAuthResponseAsync(user, clientIp, cancellationToken);
        await auditTriggers.LogUserRegisteredAsync(user.Id, cancellationToken);
        return response;
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request,
        string? clientIp,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            logger.LogWarning("Failed login attempt for unknown email {Email}", request.Email);
            await auditTriggers.LogAuthorizationFailedAsync(null, $"Failed login for unknown email {request.Email}.", cancellationToken);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            logger.LogWarning("Failed login attempt for inactive user {UserId}", user.Id);
            throw new UnauthorizedAccessException("Account is inactive.");
        }

        var signInResult = await signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            logger.LogWarning("Account locked out for user {UserId}", user.Id);
            throw new UnauthorizedAccessException("Account is locked due to repeated failed login attempts.");
        }

        if (!signInResult.Succeeded)
        {
            logger.LogWarning("Failed login attempt for user {UserId}", user.Id);
            await auditTriggers.LogAuthorizationFailedAsync(user.Id, "Invalid email or password.", cancellationToken);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        logger.LogInformation("Successful login for user {UserId}", user.Id);
        await auditTriggers.LogUserLoggedInAsync(user.Id, cancellationToken);

        return await CreateAuthResponseAsync(user, clientIp, cancellationToken);
    }

    public async Task<MessageResponse> LogoutAsync(
        string userId,
        LogoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var refreshToken = await refreshTokenService.GetActiveTokenAsync(request.RefreshToken, cancellationToken);
        if (refreshToken is null || refreshToken.UserId != userId)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        await refreshTokenService.RevokeAsync(refreshToken, cancellationToken: cancellationToken);
        logger.LogInformation("User {UserId} logged out", userId);
        await auditTriggers.LogUserLoggedOutAsync(userId, cancellationToken);

        return new MessageResponse("Logged out successfully.");
    }

    public async Task<AuthResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        string? clientIp,
        CancellationToken cancellationToken = default)
    {
        var existingToken = await refreshTokenService.GetActiveTokenAsync(request.RefreshToken, cancellationToken);
        if (existingToken is null)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        var user = await userManager.FindByIdAsync(existingToken.UserId);
        if (user is null || !user.IsActive)
        {
            await refreshTokenService.RevokeAsync(existingToken, cancellationToken: cancellationToken);
            throw new UnauthorizedAccessException("User account is not available.");
        }

        var (newPlainToken, newRefreshToken) = await refreshTokenService.CreateAsync(
            user.Id,
            clientIp,
            cancellationToken);

        await refreshTokenService.RevokeAsync(
            existingToken,
            refreshTokenService.HashToken(newPlainToken),
            cancellationToken);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.Email!, roles);

        return new AuthResponse(
            accessToken,
            tokenService.GetAccessTokenExpiration(),
            newPlainToken,
            await MapUserProfileAsync(user, roles));
    }

    public async Task<MessageResponse> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);
        await refreshTokenService.RevokeAllForUserAsync(userId, cancellationToken);

        logger.LogInformation("Password changed for user {UserId}", userId);
        await auditTriggers.LogPasswordChangedAsync(userId, cancellationToken);

        return new MessageResponse("Password changed successfully.");
    }

    public async Task<MessageResponse> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return new MessageResponse("If the account exists, a password reset email has been sent.");
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        _ = resetToken;
        logger.LogInformation(
            "Simulated password reset email sent to {Email} for user {UserId}. Reset token generated.",
            user.Email,
            user.Id);

        return new MessageResponse("If the account exists, a password reset email has been sent.");
    }

    public async Task<MessageResponse> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new InvalidOperationException("Invalid password reset request.");

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);
        await refreshTokenService.RevokeAllForUserAsync(user.Id, cancellationToken);

        logger.LogInformation("Password reset completed for user {UserId}", user.Id);

        return new MessageResponse("Password reset successfully.");
    }

    public async Task<MessageResponse> VerifyEmailAsync(
        VerifyEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new InvalidOperationException("Invalid email verification request.");

        if (user.EmailConfirmed)
        {
            return new MessageResponse("Email is already verified.");
        }

        var result = await userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException("Invalid or expired email verification token.");
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        logger.LogInformation("Email verified for user {UserId}", user.Id);

        return new MessageResponse("Email verified successfully.");
    }

    public async Task<MessageResponse> ResendVerificationEmailAsync(
        ResendVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || user.EmailConfirmed)
        {
            return new MessageResponse("If the account exists and is unverified, a verification email has been sent.");
        }

        var verificationToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
        _ = verificationToken;
        logger.LogInformation(
            "Simulated verification email resent to {Email} for user {UserId}.",
            user.Email,
            user.Id);

        return new MessageResponse("If the account exists and is unverified, a verification email has been sent.");
    }

    public async Task<UserProfileResponse> GetCurrentUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        var roles = await userManager.GetRolesAsync(user);
        return await MapUserProfileAsync(user, roles);
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        ApplicationUser user,
        string? clientIp,
        CancellationToken cancellationToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var (refreshToken, _) = await refreshTokenService.CreateAsync(user.Id, clientIp, cancellationToken);

        return new AuthResponse(
            accessToken,
            tokenService.GetAccessTokenExpiration(),
            refreshToken,
            await MapUserProfileAsync(user, roles));
    }

    private static Task<UserProfileResponse> MapUserProfileAsync(ApplicationUser user, IList<string> roles) =>
        Task.FromResult(new UserProfileResponse(
            user.Id,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.ProfileImageUrl,
            user.IsActive,
            user.EmailConfirmed,
            roles.ToList(),
            user.CreatedAt,
            user.LastLoginAt));
}
