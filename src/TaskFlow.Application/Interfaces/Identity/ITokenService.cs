namespace TaskFlow.Application.Interfaces.Identity;

/// <summary>
/// Issues JWT access tokens for authenticated users.
/// </summary>
public interface ITokenService
{
    string GenerateAccessToken(string userId, string email, IEnumerable<string> roles);

    DateTime GetAccessTokenExpiration();
}
