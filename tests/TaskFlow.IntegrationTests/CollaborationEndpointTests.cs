using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TaskFlow.Application.DTOs.Auth;
using TaskFlow.Application.DTOs.Collaboration;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.DTOs.Tasks;

namespace TaskFlow.IntegrationTests;

public class CollaborationEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CollaborationEndpointTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateComment_ThenGetThread_Succeeds()
    {
        await AuthenticateAsync();
        var taskId = await CreateTaskAsync();

        var createResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{taskId}/comments",
            new CreateCommentRequest("First comment on the task"));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var comment = await createResponse.Content.ReadFromJsonAsync<CommentResponse>(JsonOptions);
        Assert.NotNull(comment);

        var replyResponse = await _client.PostAsJsonAsync(
            $"/api/comments/{comment.Id}/reply",
            new ReplyCommentRequest("This is a reply"));

        Assert.Equal(HttpStatusCode.Created, replyResponse.StatusCode);

        var threadResponse = await _client.GetAsync($"/api/comments/{comment.Id}/thread");
        Assert.Equal(HttpStatusCode.OK, threadResponse.StatusCode);

        var thread = await threadResponse.Content.ReadFromJsonAsync<CommentThreadResponse>(JsonOptions);
        Assert.NotNull(thread);
        Assert.Single(thread.Replies);
    }

    [Fact]
    public async Task DeleteComment_DisplaysDeletedPlaceholder()
    {
        await AuthenticateAsync();
        var taskId = await CreateTaskAsync();

        var createResponse = await _client.PostAsJsonAsync(
            $"/api/tasks/{taskId}/comments",
            new CreateCommentRequest("Comment to delete"));

        var comment = await createResponse.Content.ReadFromJsonAsync<CommentResponse>(JsonOptions);
        Assert.NotNull(comment);

        var deleteResponse = await _client.DeleteAsync($"/api/comments/{comment.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/comments/{comment.Id}");
        var deleted = await getResponse.Content.ReadFromJsonAsync<CommentResponse>(JsonOptions);
        Assert.NotNull(deleted);
        Assert.True(deleted.IsDeleted);
        Assert.Equal("Comment deleted", deleted.Content);
    }

    [Fact]
    public async Task UploadAttachment_ThenDownload_Succeeds()
    {
        await AuthenticateAsync();
        var taskId = await CreateTaskAsync();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("Sample attachment content"));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        content.Add(fileContent, "file", "notes.txt");

        var uploadResponse = await _client.PostAsync($"/api/tasks/{taskId}/attachments", content);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        var attachment = await uploadResponse.Content.ReadFromJsonAsync<AttachmentResponse>(JsonOptions);
        Assert.NotNull(attachment);
        Assert.Contains("/api/attachments/", attachment.DownloadUrl);

        var downloadResponse = await _client.GetAsync($"/api/attachments/{attachment.Id}/download");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
    }

    [Fact]
    public async Task UploadExecutable_ReturnsBadRequest()
    {
        await AuthenticateAsync();
        var taskId = await CreateTaskAsync();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent([0x4D, 0x5A]);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", "malware.exe");

        var uploadResponse = await _client.PostAsync($"/api/tasks/{taskId}/attachments", content);
        Assert.Equal(HttpStatusCode.BadRequest, uploadResponse.StatusCode);
    }

    private async Task AuthenticateAsync()
    {
        var email = $"collab_{Guid.NewGuid():N}@taskflow.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email,
            "Password123!",
            "Password123!",
            "Collab",
            "User"));

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
    }

    private async Task<Guid> CreateTaskAsync()
    {
        var orgResponse = await _client.PostAsJsonAsync("/api/organizations", new CreateOrganizationRequest(
            $"Org_{Guid.NewGuid():N}",
            "Collab org",
            null));
        var organization = await orgResponse.Content.ReadFromJsonAsync<OrganizationResponse>(JsonOptions);

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            organization!.Id,
            $"Project_{Guid.NewGuid():N}",
            $"PRJ-{Guid.NewGuid():N}".Substring(0, 12),
            "Collab project"));
        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            project!.Id,
            "Collab task",
            "Task for collaboration tests"));
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponse>(JsonOptions);

        return task!.Id;
    }
}
