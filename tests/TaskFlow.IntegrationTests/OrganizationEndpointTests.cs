using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Teams;
using TaskFlow.Domain.Enums;

namespace TaskFlow.IntegrationTests;

public class OrganizationEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public OrganizationEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateOrganization_ThenGet_ReturnsOrganization()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Test organization",
            null));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var organization = await createResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);
        Assert.NotNull(organization);

        var getResponse = await _client.GetAsync($"/api/organizations/{organization.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task CreateTeam_AndAddMember_Succeeds()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Team test org",
            null));

        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);
        Assert.NotNull(organization);

        var teamResponse = await _client.PostAsJsonAsync("/api/teams", new CreateTeamRequest(
            organization.Id,
            "Platform",
            "Platform team"));

        Assert.Equal(HttpStatusCode.Created, teamResponse.StatusCode);

        var team = await teamResponse.Content.ReadFromJsonAsync<TeamResponse>(JsonOptions);
        Assert.NotNull(team);

        var auth = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            $"member_{Guid.NewGuid():N}@taskflow.test",
            "Password123!",
            "Password123!",
            "Team",
            "Member"));

        var memberAuth = await auth.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(memberAuth);

        await _client.PostAsJsonAsync(
            $"/api/organizations/{organization.Id}/members",
            new AddOrganizationMemberRequest(memberAuth.User.Id, OrganizationMemberRole.Member));

        var addMemberResponse = await _client.PostAsJsonAsync(
            $"/api/teams/{team.Id}/members",
            new AddTeamMemberRequest(memberAuth.User.Id));

        Assert.Equal(HttpStatusCode.Created, addMemberResponse.StatusCode);
    }

    [Fact]
    public async Task Organizations_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/organizations");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<string> RegisterAndGetTokenAsync()
    {
        var email = $"orguser_{Guid.NewGuid():N}@taskflow.test";
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Org",
            "User"));

        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }
}
