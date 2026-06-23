using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Tasks;

public sealed record CreateTaskRequest(
    Guid ProjectId,
    string Title,
    string? Description,
    TaskStatus Status = TaskStatus.Backlog,
    TaskPriority Priority = TaskPriority.Medium,
    TaskType Type = TaskType.Feature,
    DateOnly? StartDate = null,
    DateOnly? DueDate = null,
    decimal? EstimatedHours = null,
    int? StoryPoints = null,
    Guid? ParentTaskId = null,
    IReadOnlyList<string>? AssigneeIds = null);

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskType Type,
    DateOnly? StartDate,
    DateOnly? DueDate,
    decimal? EstimatedHours,
    decimal? ActualHours,
    int? StoryPoints,
    string RowVersion);

public sealed record AssignTaskUsersRequest(IReadOnlyList<string> UserIds);

public sealed record ChangeTaskStatusRequest(TaskStatus Status);

public sealed record ChangeTaskPriorityRequest(TaskPriority Priority);

public sealed record MoveTaskRequest(Guid TargetProjectId);

public sealed record CloneTaskRequest(bool IncludeSubtasks = false, bool IncludeAssignments = true);

public sealed record CreateSubtaskRequest(
    string Title,
    string? Description,
    TaskStatus Status = TaskStatus.Todo,
    TaskPriority Priority = TaskPriority.Medium,
    TaskType Type = TaskType.Story);

public sealed record AddTaskLabelRequest(
    Guid? LabelId,
    string? Name,
    string? Color);

public sealed record AddTaskDependencyRequest(Guid DependsOnTaskId);

public sealed record CreateChecklistRequest(string Title, int Order = 0);

public sealed record UpdateChecklistRequest(string Title, bool IsCompleted, int Order);

public sealed record UpdateTaskHoursRequest(decimal? EstimatedHours, decimal? ActualHours);

public sealed record TaskAssigneeResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    DateTimeOffset AssignedAt);

public sealed record TaskLabelResponse(Guid Id, string Name, string Color);

public sealed record TaskDependencyResponse(Guid Id, Guid TaskId, Guid DependsOnTaskId, string DependsOnTitle);

public sealed record ChecklistResponse(Guid Id, Guid TaskId, string Title, bool IsCompleted, int Order);

public sealed record TaskSummary(
    int SubtaskCount,
    int AssigneeCount,
    int LabelCount,
    int ChecklistCount,
    int CompletedChecklistCount,
    int DependencyCount);

public sealed record TaskResponse(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    TaskType Type,
    DateOnly? StartDate,
    DateOnly? DueDate,
    DateTimeOffset? CompletedAt,
    decimal? EstimatedHours,
    decimal? ActualHours,
    int? StoryPoints,
    Guid? ParentTaskId,
    string CreatedBy,
    string? UpdatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    string RowVersion,
    IReadOnlyList<TaskAssigneeResponse>? Assignees = null,
    IReadOnlyList<TaskLabelResponse>? Labels = null,
    IReadOnlyList<ChecklistResponse>? Checklists = null,
    IReadOnlyList<TaskDependencyResponse>? Dependencies = null,
    TaskSummary? Summary = null);

public sealed record TaskListQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? ProjectId = null,
    string? Search = null,
    TaskStatus? Status = null,
    TaskPriority? Priority = null,
    TaskType? Type = null,
    string? SortBy = "createdAt",
    bool SortDescending = true);

public sealed record TaskSearchQuery(
    int Page = 1,
    int PageSize = 20,
    string? Title = null,
    string? Description = null,
    Guid? ProjectId = null,
    TaskStatus? Status = null,
    TaskPriority? Priority = null,
    TaskType? Type = null,
    string? AssigneeId = null,
    Guid? LabelId = null,
    DateOnly? StartDateFrom = null,
    DateOnly? StartDateTo = null,
    DateOnly? DueDateFrom = null,
    DateOnly? DueDateTo = null,
    string? SortBy = "createdAt",
    bool SortDescending = true);
