using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.DTOs.Organizations;

namespace TaskFlow.IntegrationTests;

public class DashboardEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public DashboardEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PersonalDashboard_ReturnsOk()
    {
        await AuthenticateAsync();

        var response = await _client.GetAsync("/api/dashboard/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dashboard = await response.Content.ReadFromJsonAsync<PersonalDashboardResponse>(JsonOptions);
        Assert.NotNull(dashboard);
    }

    [Fact]
    public async Task OrganizationDashboard_AsOwner_ReturnsOk()
    {
        await AuthenticateAsync();

        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"DashOrg_{Guid.NewGuid():N}",
            "Dashboard org",
            null));
        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);

        var response = await _client.GetAsync($"/api/dashboard/organization/{organization!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TaskReport_ReturnsOk()
    {
        await AuthenticateAsync();

        var response = await _client.GetAsync("/api/reports/tasks");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var report = await response.Content.ReadFromJsonAsync<TaskReportResponse>(JsonOptions);
        Assert.NotNull(report);
    }

    [Fact]
    public async Task Dashboard_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/dashboard/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task AuthenticateAsync()
    {
        var email = $"dash_{Guid.NewGuid():N}@taskflow.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Dash",
            "User"));

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
    }
}
