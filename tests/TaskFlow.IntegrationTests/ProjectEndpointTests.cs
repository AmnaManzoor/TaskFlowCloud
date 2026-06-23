using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Domain.Enums;

namespace TaskFlow.IntegrationTests;

public class ProjectEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ProjectEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateProject_ThenGet_ReturnsProjectWithSummary()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var organization = await CreateOrganizationAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organization.Id,
            "Integration Project",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Integration test project",
            ProjectStatus.Active,
            ProjectPriority.High));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var project = await createResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);
        Assert.NotNull(project);
        Assert.NotNull(project.Summary);
        Assert.Equal(1, project.Summary.MemberCount);

        var getResponse = await _client.GetAsync($"/api/projects/{project.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task ArchiveProject_ThenUpdate_ReturnsBadRequest()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var organization = await CreateOrganizationAsync();
        var project = await CreateProjectAsync(organization.Id);

        var archiveResponse = await _client.PostAsync($"/api/projects/{project.Id}/archive", null);
        Assert.Equal(HttpStatusCode.OK, archiveResponse.StatusCode);

        var updateResponse = await _client.PutAsJsonAsync($"/api/projects/{project.Id}", new UpdateProjectRequest(
            "Updated Name",
            project.Description,
            project.StartDate,
            project.EndDate,
            project.EstimatedCompletionDate,
            project.RowVersion));

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task AddMember_AndListMembers_Succeeds()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var organization = await CreateOrganizationAsync();
        var project = await CreateProjectAsync(organization.Id);

        var memberAuth = await RegisterUserAsync();
        await _client.PostAsJsonAsync(
            $"/api/organizations/{organization.Id}/members",
            new AddOrganizationMemberRequest(memberAuth.User.Id, OrganizationMemberRole.Member));

        var addResponse = await _client.PostAsJsonAsync(
            $"/api/projects/{project.Id}/members",
            new AddProjectMemberRequest(memberAuth.User.Id, ProjectRole.Contributor));

        Assert.Equal(HttpStatusCode.Created, addResponse.StatusCode);

        var membersResponse = await _client.GetAsync($"/api/projects/{project.Id}/members");
        Assert.Equal(HttpStatusCode.OK, membersResponse.StatusCode);

        var members = await membersResponse.Content.ReadFromJsonAsync<List<ProjectMemberResponse>>(JsonOptions);
        Assert.NotNull(members);
        Assert.Equal(2, members.Count);
    }

    [Fact]
    public async Task TransferOwnership_UpdatesOwner()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var organization = await CreateOrganizationAsync();
        var project = await CreateProjectAsync(organization.Id);

        var newOwnerAuth = await RegisterUserAsync();
        await _client.PostAsJsonAsync(
            $"/api/organizations/{organization.Id}/members",
            new AddOrganizationMemberRequest(newOwnerAuth.User.Id, OrganizationMemberRole.Member));

        await _client.PostAsJsonAsync(
            $"/api/projects/{project.Id}/members",
            new AddProjectMemberRequest(newOwnerAuth.User.Id, ProjectRole.Manager));

        var transferResponse = await _client.PostAsJsonAsync(
            $"/api/projects/{project.Id}/transfer-owner",
            new TransferProjectOwnershipRequest(newOwnerAuth.User.Id));

        Assert.Equal(HttpStatusCode.OK, transferResponse.StatusCode);

        var updated = await transferResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal(newOwnerAuth.User.Id, updated.OwnerId);
    }

    [Fact]
    public async Task Projects_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/projects");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProject_ReturnsNoContent()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var organization = await CreateOrganizationAsync();
        var project = await CreateProjectAsync(organization.Id);

        var deleteResponse = await _client.DeleteAsync($"/api/projects/{project.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/projects/{project.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    private async Task<OrganizationResponse> CreateOrganizationAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Project test organization",
            null));

        return (await response.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions))!;
    }

    private async Task<ProjectResponse> CreateProjectAsync(Guid organizationId)
    {
        var response = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organizationId,
            $"Project_{Guid.NewGuid():N}",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Test project"));

        return (await response.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions))!;
    }

    private async Task<string> RegisterAndGetTokenAsync()
    {
        var auth = await RegisterUserAsync();
        return auth.AccessToken;
    }

    private async Task<AuthResponse> RegisterUserAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            $"projectuser_{Guid.NewGuid():N}@taskflow.test",
            "Password123!",
            "Password123!",
            "Project",
            "User"));

        return (await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
    }
}
