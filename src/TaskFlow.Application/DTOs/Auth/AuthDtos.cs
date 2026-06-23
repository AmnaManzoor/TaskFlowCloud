namespace TaskFlow.Application.DTOs.Auth;

public sealed record RegisterRequest(
    string Email,
    string Password,
    string ConfirmPassword,
    string FirstName,
    string LastName);

public sealed record LoginRequest(
    string Email,
    string Password);

public sealed record RefreshTokenRequest(
    string RefreshToken);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword);

public sealed record ForgotPasswordRequest(
    string Email);

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword,
    string ConfirmNewPassword);

public sealed record VerifyEmailRequest(
    string Email,
    string Token);

public sealed record ResendVerificationRequest(
    string Email);

public sealed record LogoutRequest(
    string RefreshToken);

public sealed record UserProfileResponse(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    bool IsActive,
    bool EmailConfirmed,
    IReadOnlyList<string> Roles,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    UserProfileResponse User);

public sealed record TokenResponse(
    string Message);

public sealed record MessageResponse(
    string Message);
