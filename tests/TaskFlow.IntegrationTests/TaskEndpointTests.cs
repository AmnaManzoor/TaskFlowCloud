using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.DTOs.Tasks;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Enums;

namespace TaskFlow.IntegrationTests;

public class TaskEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public TaskEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateTask_ThenGet_ReturnsTaskWithSummary()
    {
        await AuthenticateAsync();
        var project = await CreateProjectAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            project.Id,
            "Integration task",
            "Task created in integration test",
            TaskStatus.Todo,
            TaskPriority.Medium,
            TaskType.Feature));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var task = await createResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);
        Assert.NotNull(task);
        Assert.NotNull(task.Summary);

        var getResponse = await _client.GetAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task AssignUser_AndChangeStatus_Succeeds()
    {
        await AuthenticateAsync();
        var project = await CreateProjectAsync();
        var task = await CreateTaskAsync(project.Id);

        var member = await RegisterUserAsync();
        await _client.PostAsJsonAsync(
            $"/api/organizations/{project.OrganizationId}/members",
            new AddOrganizationMemberRequest(member.User.Id, OrganizationMemberRole.Member));

        var assignResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{task.Id}/assign",
            new AssignTaskUsersRequest([member.User.Id]));

        Assert.Equal(HttpStatusCode.OK, assignResponse.StatusCode);

        var statusResponse = await _client.PatchAsJsonAsync(
            $"/api/tasks/{task.Id}/status",
            new ChangeTaskStatusRequest(TaskStatus.Completed));

        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);

        var updated = await statusResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal(TaskStatus.Completed, updated.Status);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task CreateSubtask_AndChecklist_Succeeds()
    {
        await AuthenticateAsync();
        var project = await CreateProjectAsync();
        var task = await CreateTaskAsync(project.Id);

        var subtaskResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{task.Id}/subtasks",
            new CreateSubtaskRequest("Child task", "Subtask description"));

        Assert.Equal(HttpStatusCode.Created, subtaskResponse.StatusCode);

        var checklistResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{task.Id}/checklists",
            new CreateChecklistRequest("Verify build", 0));

        Assert.Equal(HttpStatusCode.Created, checklistResponse.StatusCode);
    }

    [Fact]
    public async Task CircularDependency_ReturnsBadRequest()
    {
        await AuthenticateAsync();
        var project = await CreateProjectAsync();
        var taskA = await CreateTaskAsync(project.Id, "Task A");
        var taskB = await CreateTaskAsync(project.Id, "Task B");

        await _client.PostAsJsonAsync(
            $"/api/tasks/{taskB.Id}/dependencies",
            new AddTaskDependencyRequest(taskA.Id));

        var circularResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{taskA.Id}/dependencies",
            new AddTaskDependencyRequest(taskB.Id));

        Assert.Equal(HttpStatusCode.BadRequest, circularResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteTask_ThenRestore_Succeeds()
    {
        await AuthenticateAsync();
        var project = await CreateProjectAsync();
        var task = await CreateTaskAsync(project.Id);

        var deleteResponse = await _client.DeleteAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var restoreResponse = await _client.PostAsync($"/api/tasks/{task.Id}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restoreResponse.StatusCode);
    }

    [Fact]
    public async Task Tasks_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task AuthenticateAsync()
    {
        var token = await RegisterAndGetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<ProjectResponse> CreateProjectAsync()
    {
        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Task test org",
            null));

        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organization!.Id,
            $"Project_{Guid.NewGuid():N}",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Task test project"));

        return (await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions))!;
    }

    private async Task<TaskResponse> CreateTaskAsync(Guid projectId, string title = "Test task")
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            projectId,
            title,
            "Description"));

        return (await response.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions))!;
    }

    private async Task<string> RegisterAndGetTokenAsync()
    {
        var auth = await RegisterUserAsync();
        return auth.AccessToken;
    }

    private async Task<AuthResponse> RegisterUserAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            $"taskuser_{Guid.NewGuid():N}@taskflow.test",
            "Password123!",
            "Password123!",
            "Task",
            "User"));

        return (await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
    }
}
