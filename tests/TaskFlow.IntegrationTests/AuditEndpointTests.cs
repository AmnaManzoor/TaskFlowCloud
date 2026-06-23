using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Domain.Constants;

namespace TaskFlow.IntegrationTests;

public class AuditEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuditEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task OrganizationCreate_RecordsActivityHistory()
    {
        await AuthenticateAsync();

        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"AuditOrg_{Guid.NewGuid():N}",
            "Audit test org",
            null));

        Assert.Equal(HttpStatusCode.Created, orgResponse.StatusCode);

        var activityResponse = await _client.GetAsync("/api/activity");
        Assert.Equal(HttpStatusCode.OK, activityResponse.StatusCode);

        var activity = await activityResponse.Content.ReadFromJsonAsync<PagedResult<ActivityHistoryResponse>>(JsonOptions);
        Assert.NotNull(activity);
        Assert.Contains(activity.Items, item => item.ActivityType == AuditActions.OrganizationCreated);
    }

    [Fact]
    public async Task OrganizationOwner_CanSearchAuditLogs()
    {
        await AuthenticateAsync();

        await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"AuditOrg_{Guid.NewGuid():N}",
            "Audit search org",
            null));

        var auditResponse = await _client.GetAsync("/api/auditlogs");
        Assert.Equal(HttpStatusCode.OK, auditResponse.StatusCode);

        var auditLogs = await auditResponse.Content.ReadFromJsonAsync<PagedResult<AuditLogResponse>>(JsonOptions);
        Assert.NotNull(auditLogs);
        Assert.NotEmpty(auditLogs.Items);
    }

    [Fact]
    public async Task TaskCreate_RecordsAuditLogForEntity()
    {
        await AuthenticateAsync();
        var taskId = await CreateTaskAsync();

        var auditResponse = await _client.GetAsync($"/api/auditlogs/entity/{AuditEntityTypes.Task}/{taskId}");
        Assert.Equal(HttpStatusCode.OK, auditResponse.StatusCode);

        var auditLogs = await auditResponse.Content.ReadFromJsonAsync<PagedResult<AuditLogResponse>>(JsonOptions);
        Assert.NotNull(auditLogs);
        Assert.Contains(auditLogs.Items, item => item.Action == AuditActions.TaskCreated);
    }

    [Fact]
    public async Task AuditLogs_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/auditlogs");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task AuthenticateAsync()
    {
        var email = $"audit_{Guid.NewGuid():N}@taskflow.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Audit",
            "User"));

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
    }

    private async Task<Guid> CreateTaskAsync()
    {
        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Audit org",
            null));
        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organization!.Id,
            $"Project_{Guid.NewGuid():N}",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Audit project"));
        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            project!.Id,
            "Audit task",
            "Task for audit tests"));
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);

        return task!.Id;
    }
}
