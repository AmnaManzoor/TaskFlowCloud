using TaskFlow.Application.DTOs.Auth;

namespace TaskFlow.Application.Interfaces.Identity;

/// <summary>
/// Authentication and account management operations.
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, string? clientIp, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(LoginRequest request, string? clientIp, CancellationToken cancellationToken = default);

    Task<MessageResponse> LogoutAsync(string userId, LogoutRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? clientIp, CancellationToken cancellationToken = default);

    Task<MessageResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);

    Task<MessageResponse> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task<MessageResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default);

    Task<MessageResponse> ResendVerificationEmailAsync(ResendVerificationRequest request, CancellationToken cancellationToken = default);

    Task<UserProfileResponse> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
}
