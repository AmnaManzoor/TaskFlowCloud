using System.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.Interfaces.Dashboard;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;
using TaskFlow.Infrastructure.Services.Reporting;

namespace TaskFlow.Infrastructure.Services;

public sealed class DashboardService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IReportingAccessService reportingAccessService,
    ReportingQueryScope queryScope,
    ILogger<DashboardService> logger) : IDashboardService
{
    public async Task<PersonalDashboardResponse> GetPersonalDashboardAsync(
        string currentUserId,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanViewPersonalDashboardAsync(currentUserId, cancellationToken);

        var assignedTasks = queryScope.GetAssignedTasks(currentUserId);
        var today = ReportingQueryScope.Today;
        var weekEnd = ReportingQueryScope.WeekEnd;
        var weekStart = DateTimeOffset.UtcNow.AddDays(-7);
        var monthStart = DateTimeOffset.UtcNow.AddDays(-30);

        var assignedCount = await assignedTasks.CountAsync(cancellationToken);
        var overdueCount = await assignedTasks.CountAsync(
            task => task.DueDate.HasValue
                && task.DueDate.Value < today
                && task.Status != TaskStatus.Completed
                && task.Status != TaskStatus.Cancelled,
            cancellationToken);
        var completedCount = await assignedTasks.CountAsync(task => task.Status == TaskStatus.Completed, cancellationToken);
        var dueTodayCount = await assignedTasks.CountAsync(task => task.DueDate == today, cancellationToken);
        var dueThisWeekCount = await assignedTasks.CountAsync(
            task => task.DueDate.HasValue && task.DueDate.Value >= today && task.DueDate.Value <= weekEnd,
            cancellationToken);

        var projectsQuery = await queryScope.GetAccessibleProjectsAsync(currentUserId, null, cancellationToken);
        var recentProjects = await projectsQuery
            .OrderByDescending(project => project.UpdatedAt ?? project.CreatedAt)
            .Take(5)
            .Select(project => new ProjectSummaryItem(
                project.Id,
                project.Name,
                project.Code,
                project.Status,
                project.UpdatedAt ?? project.CreatedAt))
            .ToListAsync(cancellationToken);

        var recentActivity = await dbContext.ActivityHistory.AsNoTracking()
            .Where(entry => entry.UserId == currentUserId)
            .OrderByDescending(entry => entry.CreatedAt)
            .Take(10)
            .Select(entry => new ActivityHistoryResponse(
                entry.Id,
                entry.UserId,
                entry.ActivityType,
                entry.EntityType,
                entry.EntityId,
                entry.Description,
                entry.CreatedAt))
            .ToListAsync(cancellationToken);

        var recentNotifications = await dbContext.Notifications.AsNoTracking()
            .Where(notification => notification.UserId == currentUserId)
            .OrderByDescending(notification => notification.IsRead)
            .ThenByDescending(notification => notification.CreatedAt)
            .Take(5)
            .Select(notification => new NotificationResponse(
                notification.Id,
                notification.UserId,
                notification.Type,
                notification.Title,
                notification.Message,
                notification.ReferenceType,
                notification.ReferenceId,
                notification.IsRead,
                notification.ReadAt,
                notification.CreatedAt))
            .ToListAsync(cancellationToken);

        var completedThisWeek = await assignedTasks.CountAsync(
            task => task.Status == TaskStatus.Completed && task.CompletedAt >= weekStart,
            cancellationToken);
        var completedThisMonth = await assignedTasks.CountAsync(
            task => task.Status == TaskStatus.Completed && task.CompletedAt >= monthStart,
            cancellationToken);

        var hours = await assignedTasks
            .Where(task => task.Status == TaskStatus.Completed)
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Estimated = group.Sum(task => task.EstimatedHours ?? 0),
                Actual = group.Sum(task => task.ActualHours ?? 0)
            })
            .FirstOrDefaultAsync(cancellationToken);

        stopwatch.Stop();
        await ReportingQueryScope.LogSlowQueryAsync(logger, stopwatch, "PersonalDashboard", cancellationToken);
        logger.LogInformation("Dashboard viewed: personal dashboard for user {UserId}", currentUserId);

        return new PersonalDashboardResponse(
            assignedCount,
            overdueCount,
            completedCount,
            dueTodayCount,
            dueThisWeekCount,
            recentProjects,
            recentActivity,
            recentNotifications,
            new ProductivitySummary(
                completedThisWeek,
                completedThisMonth,
                completedCount,
                hours?.Estimated,
                hours?.Actual));
    }

    public async Task<ProjectDashboardResponse> GetProjectDashboardAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanViewProjectDashboardAsync(currentUserId, projectId, cancellationToken);

        var project = await dbContext.Projects.AsNoTracking()
            .Where(entry => entry.Id == projectId)
            .Select(entry => new { entry.Id, entry.Name })
            .SingleAsync(cancellationToken);

        var tasks = dbContext.Tasks.AsNoTracking().Where(task => task.ProjectId == projectId);

        var totalTasks = await tasks.CountAsync(cancellationToken);
        var completedTasks = await tasks.CountAsync(task => task.Status == TaskStatus.Completed, cancellationToken);
        var pendingTasks = await tasks.CountAsync(
            task => task.Status == TaskStatus.Backlog || task.Status == TaskStatus.Todo,
            cancellationToken);
        var inProgressTasks = await tasks.CountAsync(
            task => task.Status == TaskStatus.InProgress || task.Status == TaskStatus.InReview,
            cancellationToken);
        var blockedTasks = await tasks.CountAsync(task => task.Status == TaskStatus.Blocked, cancellationToken);
        var today = ReportingQueryScope.Today;
        var overdueTasks = await tasks.CountAsync(
            task => task.DueDate.HasValue
                && task.DueDate.Value < today
                && task.Status != TaskStatus.Completed
                && task.Status != TaskStatus.Cancelled,
            cancellationToken);

        var completionPercentage = totalTasks == 0
            ? 0
            : Math.Round(completedTasks * 100m / totalTasks, 2);

        var memberCount = await dbContext.ProjectMembers.AsNoTracking()
            .CountAsync(member => member.ProjectId == projectId, cancellationToken);

        var workload = await (
            from assignment in dbContext.TaskAssignments.AsNoTracking()
            join task in dbContext.Tasks.AsNoTracking() on assignment.TaskId equals task.Id
            where task.ProjectId == projectId
            group assignment by assignment.UserId into grouped
            select new { UserId = grouped.Key, Count = grouped.Count() })
            .ToListAsync(cancellationToken);

        var userIds = workload.Select(item => item.UserId).ToList();
        var users = await userManager.Users.AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .Select(user => new { user.Id, user.FirstName, user.LastName })
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var workloadItems = workload
            .Select(item =>
            {
                users.TryGetValue(item.UserId, out var user);
                var displayName = user is null ? item.UserId : $"{user.FirstName} {user.LastName}".Trim();
                return new WorkloadItem(item.UserId, displayName, item.Count);
            })
            .OrderByDescending(item => item.TaskCount)
            .ToList();

        var statusDistribution = await tasks
            .GroupBy(task => task.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var priorityDistribution = await tasks
            .GroupBy(task => task.Priority)
            .Select(group => new { Priority = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        stopwatch.Stop();
        await ReportingQueryScope.LogSlowQueryAsync(logger, stopwatch, "ProjectDashboard", cancellationToken);
        logger.LogInformation("Dashboard viewed: project {ProjectId} by user {UserId}", projectId, currentUserId);

        return new ProjectDashboardResponse(
            project.Id,
            project.Name,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            blockedTasks,
            overdueTasks,
            completionPercentage,
            memberCount,
            workloadItems,
            ReportingQueryScope.BuildDistribution(
                "pie",
                statusDistribution.Select(item => (item.Status.ToString(), item.Count))),
            ReportingQueryScope.BuildDistribution(
                "pie",
                priorityDistribution.Select(item => (item.Priority.ToString(), item.Count))));
    }

    public async Task<OrganizationDashboardResponse> GetOrganizationDashboardAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanViewOrganizationDashboardAsync(currentUserId, organizationId, cancellationToken);

        var organization = await dbContext.Organizations.AsNoTracking()
            .Where(entry => entry.Id == organizationId)
            .Select(entry => new { entry.Id, entry.Name })
            .SingleAsync(cancellationToken);

        var projects = dbContext.Projects.AsNoTracking()
            .Where(project => project.OrganizationId == organizationId);

        var totalProjects = await projects.CountAsync(cancellationToken);
        var activeProjects = await projects.CountAsync(
            project => !project.IsArchived && project.Status == ProjectStatus.Active,
            cancellationToken);
        var archivedProjects = await projects.CountAsync(project => project.IsArchived, cancellationToken);

        var memberUserIds = dbContext.OrganizationMembers.AsNoTracking()
            .Where(member => member.OrganizationId == organizationId)
            .Select(member => member.UserId);

        var totalUsers = await memberUserIds.CountAsync(cancellationToken);
        var activeUsers = await userManager.Users.AsNoTracking()
            .CountAsync(user => memberUserIds.Contains(user.Id) && user.IsActive, cancellationToken);

        var teams = await dbContext.Teams.AsNoTracking()
            .CountAsync(team => team.OrganizationId == organizationId, cancellationToken);

        var projectIds = projects.Select(project => project.Id);
        var orgTasks = dbContext.Tasks.AsNoTracking().Where(task => projectIds.Contains(task.ProjectId));

        var openTasks = await orgTasks.CountAsync(
            task => task.Status != TaskStatus.Completed && task.Status != TaskStatus.Cancelled,
            cancellationToken);
        var completedTasks = await orgTasks.CountAsync(task => task.Status == TaskStatus.Completed, cancellationToken);

        var weekStart = DateTimeOffset.UtcNow.AddDays(-7);
        var monthStart = DateTimeOffset.UtcNow.AddDays(-30);
        var completedThisWeek = await orgTasks.CountAsync(
            task => task.Status == TaskStatus.Completed && task.CompletedAt >= weekStart,
            cancellationToken);
        var completedThisMonth = await orgTasks.CountAsync(
            task => task.Status == TaskStatus.Completed && task.CompletedAt >= monthStart,
            cancellationToken);

        var totalTaskCount = await orgTasks.CountAsync(cancellationToken);
        var completionRate = totalTaskCount == 0
            ? 0
            : Math.Round(completedTasks * 100m / totalTaskCount, 2);

        stopwatch.Stop();
        await ReportingQueryScope.LogSlowQueryAsync(logger, stopwatch, "OrganizationDashboard", cancellationToken);
        logger.LogInformation("Dashboard viewed: organization {OrganizationId} by user {UserId}", organizationId, currentUserId);

        return new OrganizationDashboardResponse(
            organization.Id,
            organization.Name,
            totalProjects,
            activeProjects,
            archivedProjects,
            totalUsers,
            activeUsers,
            teams,
            openTasks,
            completedTasks,
            new OrganizationProductivity(completedThisWeek, completedThisMonth, completionRate, activeProjects));
    }
}
