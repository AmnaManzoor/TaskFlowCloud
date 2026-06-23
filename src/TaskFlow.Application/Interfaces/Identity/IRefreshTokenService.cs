using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Interfaces.Identity;

/// <summary>
/// Manages refresh token lifecycle including rotation and revocation.
/// </summary>
public interface IRefreshTokenService
{
    string GenerateToken();

    string HashToken(string token);

    Task<(string PlainToken, RefreshToken Entity)> CreateAsync(
        string userId,
        string? clientIp,
        CancellationToken cancellationToken = default);

    Task<RefreshToken?> GetActiveTokenAsync(string plainToken, CancellationToken cancellationToken = default);

    Task RevokeAsync(RefreshToken token, string? replacedByTokenHash = null, CancellationToken cancellationToken = default);

    Task RevokeAllForUserAsync(string userId, CancellationToken cancellationToken = default);
}
