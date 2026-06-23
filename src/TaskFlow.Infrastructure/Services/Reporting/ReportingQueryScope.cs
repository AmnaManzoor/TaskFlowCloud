using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services.Reporting;

public sealed class ReportingQueryScope(
    ApplicationDbContext dbContext,
    IOrganizationAccessService organizationAccessService)
{
    public async Task<IQueryable<TaskItem>> GetAccessibleTasksAsync(
        string currentUserId,
        ReportFilterQuery? filter,
        CancellationToken cancellationToken)
    {
        var tasks = await BuildAccessibleTasksQueryAsync(currentUserId, cancellationToken);
        return ApplyTaskFilters(tasks, filter);
    }

    public async Task<IQueryable<Project>> GetAccessibleProjectsAsync(
        string currentUserId,
        ReportFilterQuery? filter,
        CancellationToken cancellationToken)
    {
        var projects = await BuildAccessibleProjectsQueryAsync(currentUserId, cancellationToken);
        return ApplyProjectFilters(projects, filter);
    }

    public async Task<IQueryable<Organization>> GetAccessibleOrganizationsAsync(
        string currentUserId,
        ReportFilterQuery? filter,
        CancellationToken cancellationToken)
    {
        var organizations = dbContext.Organizations.AsNoTracking().AsQueryable();

        if (!await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            var memberOrganizationIds = dbContext.OrganizationMembers
                .AsNoTracking()
                .Where(member => member.UserId == currentUserId)
                .Select(member => member.OrganizationId);

            organizations = organizations.Where(organization => memberOrganizationIds.Contains(organization.Id));
        }

        if (filter?.OrganizationId is Guid organizationId)
        {
            organizations = organizations.Where(organization => organization.Id == organizationId);
        }

        return organizations;
    }

    public IQueryable<TaskItem> GetAssignedTasks(string userId) =>
        dbContext.Tasks.AsNoTracking()
            .Where(task => dbContext.TaskAssignments.Any(
                assignment => assignment.TaskId == task.Id && assignment.UserId == userId));

    public static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    public static DateOnly WeekEnd => Today.AddDays(7 - (int)Today.DayOfWeek);

    public static bool IsOverdue(TaskItem task) =>
        task.DueDate.HasValue
        && task.DueDate.Value < Today
        && task.Status is not TaskStatus.Completed and not TaskStatus.Cancelled;

    public static bool IsPending(TaskStatus status) =>
        status is TaskStatus.Backlog or TaskStatus.Todo;

    public static DistributionChart BuildDistribution(string chartType, IEnumerable<(string Label, int Count)> items) =>
        new(chartType, items.Select(item => new ChartDataPoint(item.Label, item.Count)).ToList());

    public static async Task LogSlowQueryAsync(
        ILogger logger,
        Stopwatch stopwatch,
        string operationName,
        CancellationToken cancellationToken)
    {
        if (stopwatch.ElapsedMilliseconds > 1000)
        {
            logger.LogWarning(
                "Slow query warning: {Operation} took {ElapsedMs}ms",
                operationName,
                stopwatch.ElapsedMilliseconds);
        }

        await Task.CompletedTask;
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

    private async Task<IQueryable<Project>> BuildAccessibleProjectsQueryAsync(
        string currentUserId,
        CancellationToken cancellationToken)
    {
        var projects = dbContext.Projects.AsNoTracking().AsQueryable();

        if (await organizationAccessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return projects;
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

        return projects.Where(project =>
            adminOrganizationIds.Contains(project.OrganizationId)
            || memberProjectIds.Contains(project.Id));
    }

    private IQueryable<TaskItem> ApplyTaskFilters(IQueryable<TaskItem> tasks, ReportFilterQuery? filter)
    {
        if (filter is null)
        {
            return tasks;
        }

        if (filter.ProjectId.HasValue)
        {
            tasks = tasks.Where(task => task.ProjectId == filter.ProjectId.Value);
        }
        else if (filter.OrganizationId.HasValue)
        {
            tasks = tasks.Where(task =>
                dbContext.Projects.Any(project =>
                    project.Id == task.ProjectId && project.OrganizationId == filter.OrganizationId.Value));
        }

        if (filter.Status.HasValue)
        {
            tasks = tasks.Where(task => task.Status == filter.Status.Value);
        }

        if (filter.Priority.HasValue)
        {
            tasks = tasks.Where(task => task.Priority == filter.Priority.Value);
        }

        if (filter.TaskType.HasValue)
        {
            tasks = tasks.Where(task => task.Type == filter.TaskType.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.UserId))
        {
            tasks = tasks.Where(task =>
                dbContext.TaskAssignments.Any(assignment =>
                    assignment.TaskId == task.Id && assignment.UserId == filter.UserId));
        }

        if (filter.DateFrom.HasValue)
        {
            tasks = tasks.Where(task => task.CreatedAt >= filter.DateFrom.Value);
        }

        if (filter.DateTo.HasValue)
        {
            tasks = tasks.Where(task => task.CreatedAt <= filter.DateTo.Value);
        }

        return tasks;
    }

    private IQueryable<Project> ApplyProjectFilters(IQueryable<Project> projects, ReportFilterQuery? filter)
    {
        if (filter?.OrganizationId is Guid organizationId)
        {
            projects = projects.Where(project => project.OrganizationId == organizationId);
        }

        if (filter?.ProjectId is Guid projectId)
        {
            projects = projects.Where(project => project.Id == projectId);
        }

        if (filter?.DateFrom is DateTimeOffset dateFrom)
        {
            projects = projects.Where(project => project.CreatedAt >= dateFrom);
        }

        if (filter?.DateTo is DateTimeOffset dateTo)
        {
            projects = projects.Where(project => project.CreatedAt <= dateTo);
        }

        return projects;
    }
}
