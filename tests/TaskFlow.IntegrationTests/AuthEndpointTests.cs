using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;

namespace TaskFlow.IntegrationTests;

public class AuthEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AuthEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ThenLogin_ReturnsTokens()
    {
        var email = $"user_{Guid.NewGuid():N}@taskflow.test";

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Test",
            "User"));

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var registerPayload = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(registerPayload);
        Assert.False(string.IsNullOrWhiteSpace(registerPayload.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(registerPayload.RefreshToken));

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            email,
            "Password123!"));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "missing@taskflow.test",
            "Password123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RefreshToken_ReturnsNewTokens()
    {
        var email = $"refresh_{Guid.NewGuid():N}@taskflow.test";
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Refresh",
            "User"));

        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(auth);

        var refreshResponse = await _client.PostAsJsonAsync("/api/auth/refresh-token", new RefreshTokenRequest(auth.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        var refreshed = await refreshResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(refreshed);
        Assert.NotEqual(auth.RefreshToken, refreshed.RefreshToken);
        Assert.False(string.IsNullOrWhiteSpace(refreshed.AccessToken));
    }

    [Fact]
    public async Task ChangePassword_RequiresAuthentication()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "Password123!",
            "NewPassword123!",
            "NewPassword123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidToken_ReturnsProfile()
    {
        var email = $"me_{Guid.NewGuid():N}@taskflow.test";
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Me",
            "User"));

        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(auth);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var meResponse = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var profile = await meResponse.Content.ReadFromJsonAsync<UserProfileResponse>(JsonOptions);
        Assert.NotNull(profile);
        Assert.Equal(email, profile.Email);
        Assert.Contains("Member", profile.Roles);
    }
}
