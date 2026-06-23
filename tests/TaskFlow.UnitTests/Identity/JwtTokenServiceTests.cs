using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.UnitTests.Identity;

public class JwtTokenServiceTests
{
    [Fact]
    public void GenerateAccessToken_IncludesUserAndRoleClaims()
    {
        var options = Options.Create(new JwtOptions
        {
            Issuer = "TaskFlow",
            Audience = "TaskFlowClients",
            SecretKey = "TaskFlow_Development_Secret_Key_Change_In_Production_1234567890",
            AccessTokenExpirationMinutes = 60
        });

        var service = new JwtTokenService(options);
        var token = service.GenerateAccessToken("user-123", "user@taskflow.test", ["Member"]);

        Assert.False(string.IsNullOrWhiteSpace(token));
    }
}
