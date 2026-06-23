using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Interfaces.Identity;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Identity;

/// <summary>
/// Manages refresh token persistence, hashing, rotation, and revocation.
/// </summary>
public sealed class RefreshTokenService(
    ApplicationDbContext dbContext,
    IOptions<JwtOptions> jwtOptions) : IRefreshTokenService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public string GenerateToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    public string HashToken(string token)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hashBytes);
    }

    public async Task<(string PlainToken, RefreshToken Entity)> CreateAsync(
        string userId,
        string? clientIp,
        CancellationToken cancellationToken = default)
    {
        var plainToken = GenerateToken();
        var tokenHash = HashToken(plainToken);
        var expiresAt = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays);

        var refreshToken = RefreshToken.Create(userId, tokenHash, expiresAt, clientIp);
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (plainToken, refreshToken);
    }

    public async Task<RefreshToken?> GetActiveTokenAsync(string plainToken, CancellationToken cancellationToken = default)
    {
        var tokenHash = HashToken(plainToken);

        return await dbContext.RefreshTokens
            .SingleOrDefaultAsync(
                token => token.TokenHash == tokenHash && token.RevokedAt == null && token.ExpiresAt > DateTime.UtcNow,
                cancellationToken);
    }

    public async Task RevokeAsync(RefreshToken token, string? replacedByTokenHash = null, CancellationToken cancellationToken = default)
    {
        token.Revoke(replacedByTokenHash);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var activeTokens = await dbContext.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null && token.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke();
        }

        if (activeTokens.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
