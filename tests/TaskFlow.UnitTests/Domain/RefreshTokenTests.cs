using TaskFlow.Domain.Entities;

namespace TaskFlow.UnitTests.Domain;

public class RefreshTokenTests
{
    [Fact]
    public void Create_SetsActiveState()
    {
        var token = RefreshToken.Create("user-1", "hash", DateTime.UtcNow.AddDays(7), "127.0.0.1");

        Assert.True(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void Revoke_MarksTokenAsInactive()
    {
        var token = RefreshToken.Create("user-1", "hash", DateTime.UtcNow.AddDays(7), null);

        token.Revoke("replacement-hash");

        Assert.True(token.IsRevoked);
        Assert.False(token.IsActive);
        Assert.Equal("replacement-hash", token.ReplacedByTokenHash);
    }
}
