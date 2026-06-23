using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.IntegrationTests;

public class NotificationEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public NotificationEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task TaskAssignment_CreatesNotification()
    {
        await AuthenticateUser1Async();
        var (taskId, user2Id) = await CreateTaskAndSecondUserAsync();

        var assignResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{taskId}/assign",
            new AssignTaskUsersRequest([user2Id]));

        Assert.Equal(HttpStatusCode.OK, assignResponse.StatusCode);

        var user2Token = await LoginUser2Async();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user2Token);

        var countResponse = await _client.GetAsync("/api/notifications/count");
        var count = await countResponse.Content.ReadFromJsonAsync<NotificationCountResponse>(JsonOptions);

        Assert.NotNull(count);
        Assert.True(count.UnreadCount >= 1);
    }

    [Fact]
    public async Task MarkAsRead_ThenDeleteRead_Succeeds()
    {
        await AuthenticateUser1Async();
        var (taskId, user2Id) = await CreateTaskAndSecondUserAsync();

        await _client.PostAsJsonAsync(
            $"/api/tasks/{taskId}/assign",
            new AssignTaskUsersRequest([_user1Id]));

        var user2Token = await LoginUser2Async();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user2Token);

        await _client.PostAsJsonAsync(
            $"/api/tasks/{taskId}/comments",
            new CreateCommentRequest("Notification trigger comment"));

        await RestoreUser1AuthAsync();

        var listResponse = await _client.GetAsync("/api/notifications/unread");
        var notifications = await listResponse.Content.ReadFromJsonAsync<PagedResult<NotificationResponse>>(JsonOptions);
        Assert.NotNull(notifications);
        Assert.NotEmpty(notifications.Items);

        var notificationId = notifications.Items[0].Id;
        var readResponse = await _client.PatchAsync($"/api/notifications/{notificationId}/read", null);
        Assert.Equal(HttpStatusCode.OK, readResponse.StatusCode);

        var deleteResponse = await _client.DeleteAsync("/api/notifications/read");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Notifications_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/notifications");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private string _user1Token = string.Empty;
    private string _user1Id = string.Empty;
    private string _user2Email = string.Empty;

    private async Task AuthenticateUser1Async()
    {
        var email = $"notify1_{Guid.NewGuid():N}@taskflow.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Notify",
            "One"));

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        _user1Token = auth!.AccessToken;
        _user1Id = auth.User.Id;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _user1Token);
    }

    private Task RestoreUser1AuthAsync()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _user1Token);
        return Task.CompletedTask;
    }

    private async Task<(Guid TaskId, string User2Id)> CreateTaskAndSecondUserAsync()
    {
        var taskId = await CreateTaskAsync();

        _user2Email = $"notify2_{Guid.NewGuid():N}@taskflow.test";
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            _user2Email,
            "Password123!",
            "Password123!",
            "Notify",
            "Two"));

        var user2 = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        var org = await GetOrganizationIdFromTaskAsync(taskId);
        var projectId = await GetProjectIdFromTaskAsync(taskId);

        await _client.PostAsJsonAsync(
            $"/api/organizations/{org}/members",
            new AddOrganizationMemberRequest(user2!.User.Id, OrganizationMemberRole.Member));

        await _client.PostAsJsonAsync(
            $"/api/projects/{projectId}/members",
            new AddProjectMemberRequest(user2.User.Id, ProjectRole.Contributor));

        return (taskId, user2.User.Id);
    }

    private async Task<string> LoginUser2Async()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            _user2Email,
            "Password123!"));

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private async Task<Guid> CreateTaskAsync()
    {
        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Notify org",
            null));
        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organization!.Id,
            $"Project_{Guid.NewGuid():N}",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Notify project"));
        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            project!.Id,
            "Notify task",
            "Task for notifications"));
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);

        return task!.Id;
    }

    private async Task<Guid> GetProjectIdFromTaskAsync(Guid taskId)
    {
        var taskResponse = await _client.GetAsync($"/api/tasks/{taskId}");
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);
        return task!.ProjectId;
    }

    private async Task<Guid> GetOrganizationIdFromTaskAsync(Guid taskId)
    {
        var taskResponse = await _client.GetAsync($"/api/tasks/{taskId}");
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);
        var projectResponse = await _client.GetAsync($"/api/projects/{task!.ProjectId}");
        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);
        return project!.OrganizationId;
    }
}
