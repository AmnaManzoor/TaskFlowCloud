using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Interfaces.Tasks;

public interface ITaskAccessService
{
    Task<Guid> GetProjectIdAsync(Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanReadTaskAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanCreateTaskAsync(string userId, Guid projectId, CancellationToken cancellationToken = default);

    Task EnsureCanManageTaskAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);

    Task EnsureCanUpdateTaskAsync(string userId, Guid taskId, CancellationToken cancellationToken = default);
}

public interface ITaskService
{
    Task<TaskResponse> CreateAsync(string currentUserId, CreateTaskRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> UpdateAsync(string currentUserId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default);

    Task<TaskResponse> RestoreAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default);

    Task<TaskResponse> ArchiveAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default);

    Task<TaskResponse> AssignUsersAsync(string currentUserId, Guid taskId, AssignTaskUsersRequest request, CancellationToken cancellationToken = default);

    Task RemoveAssigneeAsync(string currentUserId, Guid taskId, string userId, CancellationToken cancellationToken = default);

    Task<TaskResponse> ChangeStatusAsync(string currentUserId, Guid taskId, ChangeTaskStatusRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> ChangePriorityAsync(string currentUserId, Guid taskId, ChangeTaskPriorityRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> MoveToProjectAsync(string currentUserId, Guid taskId, MoveTaskRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> CloneAsync(string currentUserId, Guid taskId, CloneTaskRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> DuplicateAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default);

    Task<TaskResponse> CreateSubtaskAsync(string currentUserId, Guid taskId, CreateSubtaskRequest request, CancellationToken cancellationToken = default);

    Task DeleteSubtaskAsync(string currentUserId, Guid taskId, Guid subTaskId, CancellationToken cancellationToken = default);

    Task<TaskResponse> AddLabelAsync(string currentUserId, Guid taskId, AddTaskLabelRequest request, CancellationToken cancellationToken = default);

    Task RemoveLabelAsync(string currentUserId, Guid taskId, Guid labelId, CancellationToken cancellationToken = default);

    Task<TaskDependencyResponse> AddDependencyAsync(string currentUserId, Guid taskId, AddTaskDependencyRequest request, CancellationToken cancellationToken = default);

    Task RemoveDependencyAsync(string currentUserId, Guid taskId, Guid dependencyId, CancellationToken cancellationToken = default);

    Task<ChecklistResponse> CreateChecklistAsync(string currentUserId, Guid taskId, CreateChecklistRequest request, CancellationToken cancellationToken = default);

    Task<ChecklistResponse> UpdateChecklistAsync(string currentUserId, Guid taskId, Guid checklistId, UpdateChecklistRequest request, CancellationToken cancellationToken = default);

    Task DeleteChecklistAsync(string currentUserId, Guid taskId, Guid checklistId, CancellationToken cancellationToken = default);

    Task<TaskResponse> UpdateHoursAsync(string currentUserId, Guid taskId, UpdateTaskHoursRequest request, CancellationToken cancellationToken = default);

    Task<TaskResponse> GetByIdAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default);

    Task<PagedResult<TaskResponse>> GetAllAsync(string currentUserId, TaskListQuery query, CancellationToken cancellationToken = default);

    Task<PagedResult<TaskResponse>> SearchAsync(string currentUserId, TaskSearchQuery query, CancellationToken cancellationToken = default);
}
