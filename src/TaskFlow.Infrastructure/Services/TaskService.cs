using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Tasks;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class TaskService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    ITaskAccessService accessService,
    IOrganizationAccessService organizationAccessService,
    INotificationTriggerService notificationTriggers,
    IAuditTriggerService auditTriggers,
    ILogger<TaskService> logger) : ITaskService
{
    public async Task<TaskResponse> CreateAsync(
        string currentUserId,
        CreateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanCreateTaskAsync(currentUserId, request.ProjectId, cancellationToken);
        await EnsureProjectAcceptsTasksAsync(request.ProjectId, cancellationToken);

        if (request.ParentTaskId.HasValue)
        {
            var parent = await dbContext.Tasks
                .AsNoTracking()
                .SingleOrDefaultAsync(task => task.Id == request.ParentTaskId.Value, cancellationToken)
                ?? throw new InvalidOperationException("Parent task not found.");

            if (parent.ProjectId != request.ProjectId)
            {
                throw new InvalidOperationException("Subtasks must belong to the same project as their parent.");
            }
        }

        var task = TaskItem.Create(
            request.ProjectId,
            request.Title,
            request.Description,
            request.Status,
            request.Priority,
            request.Type,
            request.StartDate,
            request.DueDate,
            request.EstimatedHours,
            request.StoryPoints,
            request.ParentTaskId,
            currentUserId);

        dbContext.Tasks.Add(task);

        if (request.AssigneeIds is { Count: > 0 })
        {
            foreach (var userId in request.AssigneeIds.Distinct(StringComparer.Ordinal))
            {
                await EnsureAssigneeEligibleAsync(userId, request.ProjectId, cancellationToken);
                dbContext.TaskAssignments.Add(TaskAssignment.Create(task.Id, userId, currentUserId));
            }
        }

        await SaveChangesWithConcurrencyAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} created in project {ProjectId} by user {UserId}", task.Id, request.ProjectId, currentUserId);

        if (request.AssigneeIds is { Count: > 0 })
        {
            foreach (var assigneeId in request.AssigneeIds.Distinct(StringComparer.Ordinal))
            {
                await notificationTriggers.NotifyTaskAssignedAsync(task.Id, assigneeId, currentUserId, cancellationToken);
                await auditTriggers.LogTaskAssignedAsync(task.Id, assigneeId, currentUserId, cancellationToken);
            }
        }

        await auditTriggers.LogTaskCreatedAsync(task.Id, currentUserId, cancellationToken);

        return await MapTaskDetailAsync(task.Id, cancellationToken);
    }

    public async Task<TaskResponse> UpdateAsync(
        string currentUserId,
        Guid taskId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanUpdateTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        ApplyRowVersion(task, request.RowVersion);
        ValidateDateRange(request.StartDate, request.DueDate);

        var previousDueDate = task.DueDate;

        task.Update(
            request.Title,
            request.Description,
            request.Type,
            request.StartDate,
            request.DueDate,
            request.EstimatedHours,
            request.ActualHours,
            request.StoryPoints,
            currentUserId);

        await SaveChangesWithConcurrencyAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} updated by user {UserId}", taskId, currentUserId);

        if (previousDueDate != request.DueDate)
        {
            await notificationTriggers.NotifyTaskDueDateChangedAsync(taskId, currentUserId, cancellationToken);
        }
        else
        {
            await notificationTriggers.NotifyTaskUpdatedAsync(taskId, currentUserId, cancellationToken);
        }

        await auditTriggers.LogTaskUpdatedAsync(
            taskId,
            currentUserId,
            new { previousDueDate, request.Title, request.Description },
            new { request.DueDate, request.Title, request.Description },
            cancellationToken);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task DeleteAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        task.SoftDelete(currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} deleted by user {UserId}", taskId, currentUserId);
        await auditTriggers.LogTaskDeletedAsync(taskId, currentUserId, cancellationToken);
    }

    public async Task<TaskResponse> RestoreAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        if (!task.IsDeleted)
        {
            throw new InvalidOperationException("Only deleted tasks can be restored.");
        }

        task.Restore(currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} restored by user {UserId}", taskId, currentUserId);
        await auditTriggers.LogTaskRestoredAsync(taskId, currentUserId, cancellationToken);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> ArchiveAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        task.Archive(currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} archived by user {UserId}", taskId, currentUserId);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> AssignUsersAsync(
        string currentUserId,
        Guid taskId,
        AssignTaskUsersRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        foreach (var userId in request.UserIds.Distinct(StringComparer.Ordinal))
        {
            if (await dbContext.TaskAssignments.AnyAsync(
                    assignment => assignment.TaskId == taskId && assignment.UserId == userId,
                    cancellationToken))
            {
                continue;
            }

            await EnsureAssigneeEligibleAsync(userId, task.ProjectId, cancellationToken);
            dbContext.TaskAssignments.Add(TaskAssignment.Create(taskId, userId, currentUserId));
            logger.LogInformation("Task {TaskId} assigned to user {UserId} by {CurrentUserId}", taskId, userId, currentUserId);
            await notificationTriggers.NotifyTaskAssignedAsync(taskId, userId, currentUserId, cancellationToken);
            await auditTriggers.LogTaskAssignedAsync(taskId, userId, currentUserId, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task RemoveAssigneeAsync(
        string currentUserId,
        Guid taskId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var assignment = await dbContext.TaskAssignments
            .SingleOrDefaultAsync(entry => entry.TaskId == taskId && entry.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Task assignment not found.");

        dbContext.TaskAssignments.Remove(assignment);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("User {UserId} unassigned from task {TaskId} by {CurrentUserId}", userId, taskId, currentUserId);
        await notificationTriggers.NotifyTaskUnassignedAsync(taskId, userId, currentUserId, cancellationToken);
        await auditTriggers.LogTaskUnassignedAsync(taskId, userId, currentUserId, cancellationToken);
    }

    public async Task<TaskResponse> ChangeStatusAsync(
        string currentUserId,
        Guid taskId,
        ChangeTaskStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanUpdateTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        var previousStatus = task.Status;
        task.ChangeStatus(request.Status, currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.Status == TaskStatus.Completed)
        {
            logger.LogInformation("Task {TaskId} completed by user {UserId}", taskId, currentUserId);
            await notificationTriggers.NotifyTaskCompletedAsync(taskId, currentUserId, cancellationToken);
            await auditTriggers.LogTaskCompletedAsync(taskId, currentUserId, cancellationToken);
        }
        else if (previousStatus == TaskStatus.Completed)
        {
            logger.LogInformation("Task {TaskId} status changed to {Status} by user {UserId}", taskId, request.Status, currentUserId);
            await notificationTriggers.NotifyTaskReopenedAsync(taskId, currentUserId, cancellationToken);
            await auditTriggers.LogTaskReopenedAsync(taskId, currentUserId, cancellationToken);
        }
        else
        {
            logger.LogInformation("Task {TaskId} status changed to {Status} by user {UserId}", taskId, request.Status, currentUserId);
        }

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> ChangePriorityAsync(
        string currentUserId,
        Guid taskId,
        ChangeTaskPriorityRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        task.ChangePriority(request.Priority, currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} priority changed to {Priority} by user {UserId}", taskId, request.Priority, currentUserId);
        await notificationTriggers.NotifyTaskPriorityChangedAsync(taskId, currentUserId, cancellationToken);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> MoveToProjectAsync(
        string currentUserId,
        Guid taskId,
        MoveTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);
        await accessService.EnsureCanCreateTaskAsync(currentUserId, request.TargetProjectId, cancellationToken);
        await EnsureProjectAcceptsTasksAsync(request.TargetProjectId, cancellationToken);

        var task = await dbContext.Tasks
            .Include(entry => entry.Subtasks)
            .SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        task.MoveToProject(request.TargetProjectId, currentUserId);
        await MoveSubtasksToProjectAsync(task.Id, request.TargetProjectId, currentUserId, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} moved to project {ProjectId} by user {UserId}", taskId, request.TargetProjectId, currentUserId);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> CloneAsync(
        string currentUserId,
        Guid taskId,
        CloneTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanCreateTaskAsync(currentUserId, await accessService.GetProjectIdAsync(taskId, cancellationToken), cancellationToken);

        var source = await LoadTaskForCloneAsync(taskId, cancellationToken);
        var clone = await CloneTaskInternalAsync(source, $"{source.Title} (Copy)", source.ParentTaskId, currentUserId, request.IncludeAssignments, cancellationToken);

        if (request.IncludeSubtasks)
        {
            var subtasks = await dbContext.Tasks
                .Include(task => task.Assignments)
                .Include(task => task.Labels)
                .Include(task => task.Checklists)
                .Where(task => task.ParentTaskId == taskId)
                .ToListAsync(cancellationToken);

            foreach (var subtask in subtasks)
            {
                await CloneTaskInternalAsync(subtask, subtask.Title, clone.Id, currentUserId, request.IncludeAssignments, cancellationToken);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} cloned to {CloneId} by user {UserId}", taskId, clone.Id, currentUserId);

        return await MapTaskDetailAsync(clone.Id, cancellationToken);
    }

    public Task<TaskResponse> DuplicateAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default) =>
        CloneAsync(currentUserId, taskId, new CloneTaskRequest(IncludeSubtasks: true, IncludeAssignments: true), cancellationToken);

    public async Task<TaskResponse> CreateSubtaskAsync(
        string currentUserId,
        Guid taskId,
        CreateSubtaskRequest request,
        CancellationToken cancellationToken = default)
    {
        var parent = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Parent task not found.");

        await accessService.EnsureCanCreateTaskAsync(currentUserId, parent.ProjectId, cancellationToken);
        await EnsureProjectAcceptsTasksAsync(parent.ProjectId, cancellationToken);

        var subtask = TaskItem.Create(
            parent.ProjectId,
            request.Title,
            request.Description,
            request.Status,
            request.Priority,
            request.Type,
            null,
            null,
            null,
            null,
            taskId,
            currentUserId);

        dbContext.Tasks.Add(subtask);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Subtask {SubtaskId} created under task {TaskId} by user {UserId}", subtask.Id, taskId, currentUserId);

        return await MapTaskDetailAsync(subtask.Id, cancellationToken);
    }

    public async Task DeleteSubtaskAsync(
        string currentUserId,
        Guid taskId,
        Guid subTaskId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var subtask = await dbContext.Tasks.SingleOrDefaultAsync(
            entry => entry.Id == subTaskId && entry.ParentTaskId == taskId,
            cancellationToken) ?? throw new KeyNotFoundException("Subtask not found.");

        subtask.SoftDelete(currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Subtask {SubtaskId} deleted from task {TaskId} by user {UserId}", subTaskId, taskId, currentUserId);
    }

    public async Task<TaskResponse> AddLabelAsync(
        string currentUserId,
        Guid taskId,
        AddTaskLabelRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        _ = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        TaskLabel label;
        if (request.LabelId.HasValue)
        {
            label = await dbContext.TaskLabels.SingleOrDefaultAsync(entry => entry.Id == request.LabelId.Value, cancellationToken)
                ?? throw new InvalidOperationException("Label not found.");
        }
        else
        {
            var labelName = request.Name!.Trim();
            var existing = await dbContext.TaskLabels.SingleOrDefaultAsync(entry => entry.Name == labelName, cancellationToken);
            if (existing is not null)
            {
                label = existing;
            }
            else
            {
                label = TaskLabel.Create(labelName, request.Color ?? "#6B7280");
                dbContext.TaskLabels.Add(label);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        if (!await dbContext.TaskItemLabels.AnyAsync(link => link.TaskId == taskId && link.LabelId == label.Id, cancellationToken))
        {
            dbContext.TaskItemLabels.Add(TaskItemLabel.Create(taskId, label.Id));
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Label {LabelId} added to task {TaskId} by user {UserId}", label.Id, taskId, currentUserId);
        }

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task RemoveLabelAsync(
        string currentUserId,
        Guid taskId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var link = await dbContext.TaskItemLabels
            .SingleOrDefaultAsync(entry => entry.TaskId == taskId && entry.LabelId == labelId, cancellationToken)
            ?? throw new KeyNotFoundException("Task label association not found.");

        dbContext.TaskItemLabels.Remove(link);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskDependencyResponse> AddDependencyAsync(
        string currentUserId,
        Guid taskId,
        AddTaskDependencyRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        var dependsOn = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == request.DependsOnTaskId, cancellationToken)
            ?? throw new InvalidOperationException("Dependency task not found.");

        if (dependsOn.ProjectId != task.ProjectId)
        {
            throw new InvalidOperationException("Dependencies must be within the same project.");
        }

        if (await dbContext.TaskDependencies.AnyAsync(
                dependency => dependency.TaskId == taskId && dependency.DependsOnTaskId == request.DependsOnTaskId,
                cancellationToken))
        {
            throw new InvalidOperationException("Dependency already exists.");
        }

        await EnsureNoCircularDependencyAsync(taskId, request.DependsOnTaskId, cancellationToken);

        var dependency = TaskDependency.Create(taskId, request.DependsOnTaskId);
        dbContext.TaskDependencies.Add(dependency);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Dependency {DependencyId} added to task {TaskId} by user {UserId}", dependency.Id, taskId, currentUserId);

        return new TaskDependencyResponse(dependency.Id, taskId, request.DependsOnTaskId, dependsOn.Title);
    }

    public async Task RemoveDependencyAsync(
        string currentUserId,
        Guid taskId,
        Guid dependencyId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var dependency = await dbContext.TaskDependencies
            .SingleOrDefaultAsync(entry => entry.Id == dependencyId && entry.TaskId == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Dependency not found.");

        dbContext.TaskDependencies.Remove(dependency);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ChecklistResponse> CreateChecklistAsync(
        string currentUserId,
        Guid taskId,
        CreateChecklistRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        _ = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        var checklist = Checklist.Create(taskId, request.Title, request.Order);
        dbContext.Checklists.Add(checklist);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapChecklist(checklist);
    }

    public async Task<ChecklistResponse> UpdateChecklistAsync(
        string currentUserId,
        Guid taskId,
        Guid checklistId,
        UpdateChecklistRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanUpdateTaskAsync(currentUserId, taskId, cancellationToken);

        var checklist = await dbContext.Checklists
            .SingleOrDefaultAsync(entry => entry.Id == checklistId && entry.TaskId == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Checklist item not found.");

        checklist.Update(request.Title, request.IsCompleted, request.Order);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Checklist {ChecklistId} updated on task {TaskId} by user {UserId}", checklistId, taskId, currentUserId);

        return MapChecklist(checklist);
    }

    public async Task DeleteChecklistAsync(
        string currentUserId,
        Guid taskId,
        Guid checklistId,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanManageTaskAsync(currentUserId, taskId, cancellationToken);

        var checklist = await dbContext.Checklists
            .SingleOrDefaultAsync(entry => entry.Id == checklistId && entry.TaskId == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Checklist item not found.");

        dbContext.Checklists.Remove(checklist);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskResponse> UpdateHoursAsync(
        string currentUserId,
        Guid taskId,
        UpdateTaskHoursRequest request,
        CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanUpdateTaskAsync(currentUserId, taskId, cancellationToken);

        var task = await dbContext.Tasks.SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        task.UpdateHours(request.EstimatedHours, request.ActualHours, currentUserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Task {TaskId} hours updated by user {UserId}", taskId, currentUserId);

        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<TaskResponse> GetByIdAsync(string currentUserId, Guid taskId, CancellationToken cancellationToken = default)
    {
        await accessService.EnsureCanReadTaskAsync(currentUserId, taskId, cancellationToken);
        return await MapTaskDetailAsync(taskId, cancellationToken);
    }

    public async Task<PagedResult<TaskResponse>> GetAllAsync(
        string currentUserId,
        TaskListQuery query,
        CancellationToken cancellationToken = default)
    {
        var tasks = await BuildAccessibleTasksQueryAsync(currentUserId, cancellationToken);
        tasks = ApplyListFilters(tasks, query.ProjectId, query.Search, query.Status, query.Priority, query.Type);
        return await ToPagedResultAsync(tasks, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    public async Task<PagedResult<TaskResponse>> SearchAsync(
        string currentUserId,
        TaskSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        var tasks = await BuildAccessibleTasksQueryAsync(currentUserId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(query.Title))
        {
            var title = query.Title.Trim();
            tasks = tasks.Where(task => task.Title.Contains(title));
        }

        if (!string.IsNullOrWhiteSpace(query.Description))
        {
            var description = query.Description.Trim();
            tasks = tasks.Where(task => task.Description != null && task.Description.Contains(description));
        }

        if (query.ProjectId.HasValue)
        {
            tasks = tasks.Where(task => task.ProjectId == query.ProjectId.Value);
        }

        if (query.Status.HasValue)
        {
            tasks = tasks.Where(task => task.Status == query.Status.Value);
        }

        if (query.Priority.HasValue)
        {
            tasks = tasks.Where(task => task.Priority == query.Priority.Value);
        }

        if (query.Type.HasValue)
        {
            tasks = tasks.Where(task => task.Type == query.Type.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.AssigneeId))
        {
            tasks = tasks.Where(task =>
                dbContext.TaskAssignments.Any(assignment =>
                    assignment.TaskId == task.Id && assignment.UserId == query.AssigneeId));
        }

        if (query.LabelId.HasValue)
        {
            tasks = tasks.Where(task =>
                dbContext.TaskItemLabels.Any(link =>
                    link.TaskId == task.Id && link.LabelId == query.LabelId.Value));
        }

        if (query.StartDateFrom.HasValue)
        {
            tasks = tasks.Where(task => task.StartDate >= query.StartDateFrom.Value);
        }

        if (query.StartDateTo.HasValue)
        {
            tasks = tasks.Where(task => task.StartDate <= query.StartDateTo.Value);
        }

        if (query.DueDateFrom.HasValue)
        {
            tasks = tasks.Where(task => task.DueDate >= query.DueDateFrom.Value);
        }

        if (query.DueDateTo.HasValue)
        {
            tasks = tasks.Where(task => task.DueDate <= query.DueDateTo.Value);
        }

        return await ToPagedResultAsync(tasks, query.Page, query.PageSize, query.SortBy, query.SortDescending, cancellationToken);
    }

    private async Task<IQueryable<TaskItem>> BuildAccessibleTasksQueryAsync(
        string currentUserId,
        CancellationToken cancellationToken)
    {
        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return dbContext.Tasks.AsNoTracking();
        }

        var adminOrganizationIds = dbContext.OrganizationMembers
            .Where(member =>
                member.UserId == currentUserId
                && (member.Role == OrganizationMemberRole.Owner
                    || member.Role == OrganizationMemberRole.Administrator))
            .Select(member => member.OrganizationId);

        var memberProjectIds = dbContext.ProjectMembers
            .Where(member => member.UserId == currentUserId)
            .Select(member => member.ProjectId);

        var accessibleProjectIds = dbContext.Projects
            .Where(project =>
                adminOrganizationIds.Contains(project.OrganizationId)
                || memberProjectIds.Contains(project.Id))
            .Select(project => project.Id);

        return dbContext.Tasks.AsNoTracking().Where(task => accessibleProjectIds.Contains(task.ProjectId));
    }

    private static IQueryable<TaskItem> ApplyListFilters(
        IQueryable<TaskItem> tasks,
        Guid? projectId,
        string? search,
        TaskStatus? status,
        TaskPriority? priority,
        TaskType? type)
    {
        if (projectId.HasValue)
        {
            tasks = tasks.Where(task => task.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            tasks = tasks.Where(task =>
                task.Title.Contains(term)
                || (task.Description != null && task.Description.Contains(term)));
        }

        if (status.HasValue)
        {
            tasks = tasks.Where(task => task.Status == status.Value);
        }

        if (priority.HasValue)
        {
            tasks = tasks.Where(task => task.Priority == priority.Value);
        }

        if (type.HasValue)
        {
            tasks = tasks.Where(task => task.Type == type.Value);
        }

        return tasks;
    }

    private async Task<PagedResult<TaskResponse>> ToPagedResultAsync(
        IQueryable<TaskItem> tasks,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken)
    {
        tasks = ApplySorting(tasks, sortBy, sortDescending);

        var totalCount = await tasks.CountAsync(cancellationToken);
        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var taskIds = await tasks
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(task => task.Id)
            .ToListAsync(cancellationToken);

        var items = new List<TaskResponse>();
        foreach (var taskId in taskIds)
        {
            items.Add(await MapTaskDetailAsync(taskId, cancellationToken, includeDetails: false));
        }

        return new PagedResult<TaskResponse>(items, normalizedPage, normalizedPageSize, totalCount);
    }

    private async Task<TaskResponse> MapTaskDetailAsync(
        Guid taskId,
        CancellationToken cancellationToken,
        bool includeDetails = true)
    {
        var task = await dbContext.Tasks.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

        if (!includeDetails)
        {
            return MapTask(task);
        }

        var assignments = await dbContext.TaskAssignments.AsNoTracking()
            .Where(assignment => assignment.TaskId == taskId)
            .ToListAsync(cancellationToken);

        var userIds = assignments.Select(assignment => assignment.UserId).ToList();
        var users = await userManager.Users
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var assignees = assignments
            .Where(assignment => users.ContainsKey(assignment.UserId))
            .Select(assignment =>
            {
                var user = users[assignment.UserId];
                return new TaskAssigneeResponse(
                    assignment.UserId,
                    user.Email!,
                    user.FirstName,
                    user.LastName,
                    assignment.AssignedAt);
            })
            .ToList();

        var labels = await dbContext.TaskItemLabels.AsNoTracking()
            .Where(link => link.TaskId == taskId)
            .Join(dbContext.TaskLabels.AsNoTracking(), link => link.LabelId, label => label.Id, (_, label) => label)
            .Select(label => new TaskLabelResponse(label.Id, label.Name, label.Color))
            .ToListAsync(cancellationToken);

        var checklists = await dbContext.Checklists.AsNoTracking()
            .Where(checklist => checklist.TaskId == taskId)
            .OrderBy(checklist => checklist.Order)
            .Select(checklist => MapChecklist(checklist))
            .ToListAsync(cancellationToken);

        var dependencies = await dbContext.TaskDependencies.AsNoTracking()
            .Where(dependency => dependency.TaskId == taskId)
            .Join(
                dbContext.Tasks.AsNoTracking(),
                dependency => dependency.DependsOnTaskId,
                dependsOn => dependsOn.Id,
                (dependency, dependsOn) => new TaskDependencyResponse(
                    dependency.Id,
                    dependency.TaskId,
                    dependency.DependsOnTaskId,
                    dependsOn.Title))
            .ToListAsync(cancellationToken);

        var subtaskCount = await dbContext.Tasks.CountAsync(entry => entry.ParentTaskId == taskId, cancellationToken);

        var summary = new TaskSummary(
            subtaskCount,
            assignees.Count,
            labels.Count,
            checklists.Count,
            checklists.Count(item => item.IsCompleted),
            dependencies.Count);

        return MapTask(task, assignees, labels, checklists, dependencies, summary);
    }

    private static TaskResponse MapTask(
        TaskItem task,
        IReadOnlyList<TaskAssigneeResponse>? assignees = null,
        IReadOnlyList<TaskLabelResponse>? labels = null,
        IReadOnlyList<ChecklistResponse>? checklists = null,
        IReadOnlyList<TaskDependencyResponse>? dependencies = null,
        TaskSummary? summary = null) =>
        new(
            task.Id,
            task.ProjectId,
            task.Title,
            task.Description,
            task.Status,
            task.Priority,
            task.Type,
            task.StartDate,
            task.DueDate,
            task.CompletedAt,
            task.EstimatedHours,
            task.ActualHours,
            task.StoryPoints,
            task.ParentTaskId,
            task.CreatedBy,
            task.UpdatedBy,
            task.CreatedAt,
            task.UpdatedAt,
            Convert.ToBase64String(task.RowVersion),
            assignees,
            labels,
            checklists,
            dependencies,
            summary);

    private static ChecklistResponse MapChecklist(Checklist checklist) =>
        new(checklist.Id, checklist.TaskId, checklist.Title, checklist.IsCompleted, checklist.Order);

    private async Task EnsureProjectAcceptsTasksAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.AsNoTracking().SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot receive new tasks.");
        }
    }

    private async Task EnsureAssigneeEligibleAsync(string userId, Guid projectId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("Assignee not found.");

        if (!user.IsActive)
        {
            throw new InvalidOperationException("Inactive users cannot be assigned to tasks.");
        }

        var organizationId = await dbContext.Projects
            .Where(project => project.Id == projectId)
            .Select(project => project.OrganizationId)
            .SingleAsync(cancellationToken);

        var isMember = await dbContext.OrganizationMembers
            .AnyAsync(member => member.OrganizationId == organizationId && member.UserId == userId, cancellationToken);

        if (!isMember)
        {
            throw new InvalidOperationException("Assignee must be a member of the project's organization.");
        }
    }

    private async Task EnsureNoCircularDependencyAsync(
        Guid taskId,
        Guid dependsOnTaskId,
        CancellationToken cancellationToken)
    {
        var visited = new HashSet<Guid>();
        var stack = new Stack<Guid>();
        stack.Push(dependsOnTaskId);

        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (current == taskId)
            {
                throw new InvalidOperationException("Circular task dependencies are not allowed.");
            }

            if (!visited.Add(current))
            {
                continue;
            }

            var dependencies = await dbContext.TaskDependencies
                .AsNoTracking()
                .Where(dependency => dependency.TaskId == current)
                .Select(dependency => dependency.DependsOnTaskId)
                .ToListAsync(cancellationToken);

            foreach (var dependencyId in dependencies)
            {
                stack.Push(dependencyId);
            }
        }
    }

    private async Task<TaskItem> LoadTaskForCloneAsync(Guid taskId, CancellationToken cancellationToken) =>
        await dbContext.Tasks
            .Include(task => task.Assignments)
            .Include(task => task.Labels)
            .Include(task => task.Checklists)
            .Include(task => task.Subtasks)
            .SingleOrDefaultAsync(task => task.Id == taskId, cancellationToken)
            ?? throw new KeyNotFoundException("Task not found.");

    private async Task<TaskItem> CloneTaskInternalAsync(
        TaskItem source,
        string title,
        Guid? parentTaskId,
        string currentUserId,
        bool includeAssignments,
        CancellationToken cancellationToken)
    {
        var clone = TaskItem.Create(
            source.ProjectId,
            title,
            source.Description,
            source.Status,
            source.Priority,
            source.Type,
            source.StartDate,
            source.DueDate,
            source.EstimatedHours,
            source.StoryPoints,
            parentTaskId,
            currentUserId);

        dbContext.Tasks.Add(clone);

        foreach (var checklist in source.Checklists)
        {
            dbContext.Checklists.Add(Checklist.Create(clone.Id, checklist.Title, checklist.Order));
        }

        foreach (var link in source.Labels)
        {
            dbContext.TaskItemLabels.Add(TaskItemLabel.Create(clone.Id, link.LabelId));
        }

        if (includeAssignments)
        {
            foreach (var assignment in source.Assignments)
            {
                await EnsureAssigneeEligibleAsync(assignment.UserId, source.ProjectId, cancellationToken);
                dbContext.TaskAssignments.Add(TaskAssignment.Create(clone.Id, assignment.UserId, currentUserId));
            }
        }

        return clone;
    }

    private async Task MoveSubtasksToProjectAsync(
        Guid parentTaskId,
        Guid targetProjectId,
        string currentUserId,
        CancellationToken cancellationToken)
    {
        var subtasks = await dbContext.Tasks
            .Where(task => task.ParentTaskId == parentTaskId)
            .ToListAsync(cancellationToken);

        foreach (var subtask in subtasks)
        {
            subtask.MoveToProject(targetProjectId, currentUserId);
            await MoveSubtasksToProjectAsync(subtask.Id, targetProjectId, currentUserId, cancellationToken);
        }
    }

    private static IQueryable<TaskItem> ApplySorting(
        IQueryable<TaskItem> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "title" => sortDescending ? query.OrderByDescending(task => task.Title) : query.OrderBy(task => task.Title),
            "status" => sortDescending ? query.OrderByDescending(task => task.Status) : query.OrderBy(task => task.Status),
            "priority" => sortDescending ? query.OrderByDescending(task => task.Priority) : query.OrderBy(task => task.Priority),
            "duedate" => sortDescending ? query.OrderByDescending(task => task.DueDate) : query.OrderBy(task => task.DueDate),
            "startdate" => sortDescending ? query.OrderByDescending(task => task.StartDate) : query.OrderBy(task => task.StartDate),
            _ => sortDescending ? query.OrderByDescending(task => task.CreatedAt) : query.OrderBy(task => task.CreatedAt)
        };

    private static void ValidateDateRange(DateOnly? startDate, DateOnly? dueDate)
    {
        if (startDate.HasValue && dueDate.HasValue && dueDate.Value < startDate.Value)
        {
            throw new InvalidOperationException("Due date cannot be earlier than start date.");
        }
    }

    private void ApplyRowVersion(TaskItem task, string rowVersionBase64)
    {
        try
        {
            var rowVersion = Convert.FromBase64String(rowVersionBase64);
            dbContext.Entry(task).Property(entry => entry.RowVersion).OriginalValue = rowVersion;
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Invalid row version value.");
        }
    }

    private async Task SaveChangesWithConcurrencyAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException(
                "The task was modified by another user. Please refresh and try again.");
        }
    }
}
