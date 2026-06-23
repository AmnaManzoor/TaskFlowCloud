using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Interfaces.Tasks;

namespace TaskFlow.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks")
            .WithTags("Tasks")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        group.MapPost("/", CreateAsync)
            .AddEndpointFilter<ValidationFilter<CreateTaskRequest>>();

        group.MapGet("/", GetAllAsync);

        group.MapGet("/search", SearchAsync);

        group.MapGet("/{id:guid}", GetByIdAsync);

        group.MapPut("/{id:guid}", UpdateAsync)
            .AddEndpointFilter<ValidationFilter<UpdateTaskRequest>>();

        group.MapDelete("/{id:guid}", DeleteAsync);

        group.MapPost("/{id:guid}/restore", RestoreAsync);

        group.MapPost("/{id:guid}/archive", ArchiveAsync);

        group.MapPost("/{id:guid}/assign", AssignUsersAsync)
            .AddEndpointFilter<ValidationFilter<AssignTaskUsersRequest>>();

        group.MapDelete("/{id:guid}/assign/{userId}", RemoveAssigneeAsync);

        group.MapPatch("/{id:guid}/status", ChangeStatusAsync)
            .AddEndpointFilter<ValidationFilter<ChangeTaskStatusRequest>>();

        group.MapPatch("/{id:guid}/priority", ChangePriorityAsync)
            .AddEndpointFilter<ValidationFilter<ChangeTaskPriorityRequest>>();

        group.MapPatch("/{id:guid}/hours", UpdateHoursAsync)
            .AddEndpointFilter<ValidationFilter<UpdateTaskHoursRequest>>();

        group.MapPost("/{id:guid}/move", MoveToProjectAsync)
            .AddEndpointFilter<ValidationFilter<MoveTaskRequest>>();

        group.MapPost("/{id:guid}/clone", CloneAsync)
            .AddEndpointFilter<ValidationFilter<CloneTaskRequest>>();

        group.MapPost("/{id:guid}/duplicate", DuplicateAsync);

        group.MapPost("/{id:guid}/subtasks", CreateSubtaskAsync)
            .AddEndpointFilter<ValidationFilter<CreateSubtaskRequest>>();

        group.MapDelete("/{id:guid}/subtasks/{subTaskId:guid}", DeleteSubtaskAsync);

        group.MapPost("/{id:guid}/labels", AddLabelAsync)
            .AddEndpointFilter<ValidationFilter<AddTaskLabelRequest>>();

        group.MapDelete("/{id:guid}/labels/{labelId:guid}", RemoveLabelAsync);

        group.MapPost("/{id:guid}/dependencies", AddDependencyAsync)
            .AddEndpointFilter<ValidationFilter<AddTaskDependencyRequest>>();

        group.MapDelete("/{id:guid}/dependencies/{dependencyId:guid}", RemoveDependencyAsync);

        group.MapPost("/{id:guid}/checklists", CreateChecklistAsync)
            .AddEndpointFilter<ValidationFilter<CreateChecklistRequest>>();

        group.MapPut("/{id:guid}/checklists/{checklistId:guid}", UpdateChecklistAsync)
            .AddEndpointFilter<ValidationFilter<UpdateChecklistRequest>>();

        group.MapDelete("/{id:guid}/checklists/{checklistId:guid}", DeleteChecklistAsync);

        return app;
    }

    private static async Task<IResult> CreateAsync(
        CreateTaskRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateAsync(GetUserId(user), request, cancellationToken);
        return Results.Created($"/api/tasks/{response.Id}", response);
    }

    private static async Task<IResult> GetAllAsync(
        [AsParameters] TaskListQuery query,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetAllAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> SearchAsync(
        [AsParameters] TaskSearchQuery query,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.SearchAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetByIdAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateTaskRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(GetUserId(user), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> RestoreAsync(
        Guid id,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.RestoreAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ArchiveAsync(
        Guid id,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ArchiveAsync(GetUserId(user), id, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> AssignUsersAsync(
        Guid id,
        AssignTaskUsersRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AssignUsersAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RemoveAssigneeAsync(
        Guid id,
        string userId,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.RemoveAssigneeAsync(GetUserId(user), id, userId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ChangeStatusAsync(
        Guid id,
        ChangeTaskStatusRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ChangeStatusAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> ChangePriorityAsync(
        Guid id,
        ChangeTaskPriorityRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.ChangePriorityAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateHoursAsync(
        Guid id,
        UpdateTaskHoursRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateHoursAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> MoveToProjectAsync(
        Guid id,
        MoveTaskRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.MoveToProjectAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> CloneAsync(
        Guid id,
        CloneTaskRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CloneAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/tasks/{response.Id}", response);
    }

    private static async Task<IResult> DuplicateAsync(
        Guid id,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.DuplicateAsync(GetUserId(user), id, cancellationToken);
        return Results.Created($"/api/tasks/{response.Id}", response);
    }

    private static async Task<IResult> CreateSubtaskAsync(
        Guid id,
        CreateSubtaskRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateSubtaskAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/tasks/{response.Id}", response);
    }

    private static async Task<IResult> DeleteSubtaskAsync(
        Guid id,
        Guid subTaskId,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteSubtaskAsync(GetUserId(user), id, subTaskId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AddLabelAsync(
        Guid id,
        AddTaskLabelRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AddLabelAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> RemoveLabelAsync(
        Guid id,
        Guid labelId,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.RemoveLabelAsync(GetUserId(user), id, labelId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AddDependencyAsync(
        Guid id,
        AddTaskDependencyRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.AddDependencyAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/tasks/{id}/dependencies/{response.Id}", response);
    }

    private static async Task<IResult> RemoveDependencyAsync(
        Guid id,
        Guid dependencyId,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.RemoveDependencyAsync(GetUserId(user), id, dependencyId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> CreateChecklistAsync(
        Guid id,
        CreateChecklistRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateChecklistAsync(GetUserId(user), id, request, cancellationToken);
        return Results.Created($"/api/tasks/{id}/checklists/{response.Id}", response);
    }

    private static async Task<IResult> UpdateChecklistAsync(
        Guid id,
        Guid checklistId,
        UpdateChecklistRequest request,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.UpdateChecklistAsync(GetUserId(user), id, checklistId, request, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteChecklistAsync(
        Guid id,
        Guid checklistId,
        ITaskService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        await service.DeleteChecklistAsync(GetUserId(user), id, checklistId, cancellationToken);
        return Results.NoContent();
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
