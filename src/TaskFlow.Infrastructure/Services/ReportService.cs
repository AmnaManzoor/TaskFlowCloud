using System.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Dashboard;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;
using TaskFlow.Infrastructure.Services.Reporting;

namespace TaskFlow.Infrastructure.Services;

public sealed class ReportService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IReportingAccessService reportingAccessService,
    IAuditAccessService auditAccessService,
    ReportingQueryScope queryScope,
    ILogger<ReportService> logger) : IReportService
{
    public async Task<TaskReportResponse> GetTaskReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var totalCount = await tasks.CountAsync(cancellationToken);

        var statusGroups = await tasks.GroupBy(task => task.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        var priorityGroups = await tasks.GroupBy(task => task.Priority)
            .Select(group => new { Priority = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        var typeGroups = await tasks.GroupBy(task => task.Type)
            .Select(group => new { Type = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        tasks = ApplyTaskSorting(tasks, query.SortBy, query.SortDescending);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await tasks
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(task => new
            {
                task.Id,
                task.Title,
                task.Status,
                task.Priority,
                task.Type,
                task.ProjectId,
                ProjectName = task.Project.Name,
                task.DueDate,
                task.CompletedAt
            })
            .ToListAsync(cancellationToken);

        var taskIds = items.Select(item => item.Id).ToList();
        var assignments = await dbContext.TaskAssignments.AsNoTracking()
            .Where(assignment => taskIds.Contains(assignment.TaskId))
            .GroupBy(assignment => assignment.TaskId)
            .Select(group => new { TaskId = group.Key, UserIds = group.Select(a => a.UserId).ToList() })
            .ToDictionaryAsync(entry => entry.TaskId, entry => (IReadOnlyList<string>)entry.UserIds, cancellationToken);

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "TaskReport", currentUserId, cancellationToken);

        return new TaskReportResponse(
            new ReportSummary(totalCount, statusGroups.ToDictionary(g => g.Status.ToString(), g => g.Count)),
            ReportingQueryScope.BuildDistribution("bar", statusGroups.Select(g => (g.Status.ToString(), g.Count))),
            ReportingQueryScope.BuildDistribution("pie", priorityGroups.Select(g => (g.Priority.ToString(), g.Count))),
            ReportingQueryScope.BuildDistribution("bar", typeGroups.Select(g => (g.Type.ToString(), g.Count))),
            items.Select(item => new TaskReportItem(
                item.Id,
                item.Title,
                item.Status,
                item.Priority,
                item.Type,
                item.ProjectId,
                item.ProjectName,
                item.DueDate,
                item.CompletedAt,
                assignments.GetValueOrDefault(item.Id, Array.Empty<string>()))).ToList(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<ProjectReportResponse> GetProjectReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var projects = await queryScope.GetAccessibleProjectsAsync(currentUserId, query, cancellationToken);
        var totalCount = await projects.CountAsync(cancellationToken);

        var statusGroups = await projects.GroupBy(project => project.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var ownerGroups = await projects.GroupBy(project => project.OwnerId)
            .Select(group => new { OwnerId = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        projects = ApplyProjectSorting(projects, query.SortBy, query.SortDescending);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var itemsRaw = await projects
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(project => new
            {
                project.Id,
                project.Name,
                project.Code,
                project.Status,
                project.Priority,
                project.OwnerId,
                project.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var projectIds = itemsRaw.Select(item => item.Id).ToList();
        var taskCounts = await dbContext.Tasks.AsNoTracking()
            .Where(task => projectIds.Contains(task.ProjectId))
            .GroupBy(task => task.ProjectId)
            .Select(group => new
            {
                ProjectId = group.Key,
                Total = group.Count(),
                Completed = group.Count(task => task.Status == TaskStatus.Completed)
            })
            .ToDictionaryAsync(entry => entry.ProjectId, cancellationToken);

        var items = itemsRaw.Select(item =>
        {
            taskCounts.TryGetValue(item.Id, out var counts);
            return new ProjectReportItem(
                item.Id,
                item.Name,
                item.Code,
                item.Status,
                item.Priority,
                counts?.Total ?? 0,
                counts?.Completed ?? 0,
                item.OwnerId,
                item.CreatedAt);
        }).ToList();

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "ProjectReport", currentUserId, cancellationToken);

        return new ProjectReportResponse(
            new ReportSummary(totalCount, statusGroups.ToDictionary(g => g.Status.ToString(), g => g.Count)),
            ReportingQueryScope.BuildDistribution("pie", statusGroups.Select(g => (g.Status.ToString(), g.Count))),
            ReportingQueryScope.BuildDistribution("bar", ownerGroups.Select(g => (g.OwnerId, g.Count))),
            items,
            page,
            pageSize,
            totalCount);
    }

    public async Task<OrganizationReportResponse> GetOrganizationReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateOrganizationReportAsync(currentUserId, query.OrganizationId, cancellationToken);

        var organizations = await queryScope.GetAccessibleOrganizationsAsync(currentUserId, query, cancellationToken);
        var totalCount = await organizations.CountAsync(cancellationToken);

        organizations = ApplyOrganizationSorting(organizations, query.SortBy, query.SortDescending);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var orgRaw = await organizations
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(organization => new
            {
                organization.Id,
                organization.Name,
                organization.IsActive,
                organization.CreatedAt,
                ProjectCount = organization.Projects.Count,
                MemberCount = organization.Members.Count,
                TeamCount = organization.Teams.Count
            })
            .ToListAsync(cancellationToken);

        var orgIds = orgRaw.Select(item => item.Id).ToList();
        var orgProjectIds = await dbContext.Projects.AsNoTracking()
            .Where(project => orgIds.Contains(project.OrganizationId))
            .Select(project => new { project.Id, project.OrganizationId })
            .ToListAsync(cancellationToken);

        var openTaskCounts = await dbContext.Tasks.AsNoTracking()
            .Where(task => orgProjectIds.Select(p => p.Id).Contains(task.ProjectId)
                && task.Status != TaskStatus.Completed
                && task.Status != TaskStatus.Cancelled)
            .Join(
                dbContext.Projects.AsNoTracking(),
                task => task.ProjectId,
                project => project.Id,
                (task, project) => project.OrganizationId)
            .GroupBy(organizationId => organizationId)
            .Select(group => new { OrganizationId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(entry => entry.OrganizationId, entry => entry.Count, cancellationToken);

        var items = orgRaw.Select(item => new OrganizationReportItem(
            item.Id,
            item.Name,
            item.IsActive,
            item.ProjectCount,
            item.MemberCount,
            item.TeamCount,
            openTaskCounts.GetValueOrDefault(item.Id),
            item.CreatedAt)).ToList();

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "OrganizationReport", currentUserId, cancellationToken);

        return new OrganizationReportResponse(
            new ReportSummary(totalCount, new Dictionary<string, int> { ["organizations"] = totalCount }),
            items,
            page,
            pageSize,
            totalCount);
    }

    public async Task<UserActivityReportResponse> GetUserActivityReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var targetUserId = string.IsNullOrWhiteSpace(query.UserId) ? currentUserId : query.UserId;
        if (!string.Equals(targetUserId, currentUserId, StringComparison.Ordinal))
        {
            await auditAccessService.EnsureCanViewUserAuditLogsAsync(currentUserId, targetUserId, cancellationToken);
        }

        var activityQuery = dbContext.ActivityHistory.AsNoTracking()
            .Where(entry => entry.UserId == targetUserId);

        if (query.DateFrom.HasValue)
        {
            activityQuery = activityQuery.Where(entry => entry.CreatedAt >= query.DateFrom.Value);
        }

        if (query.DateTo.HasValue)
        {
            activityQuery = activityQuery.Where(entry => entry.CreatedAt <= query.DateTo.Value);
        }

        var activityCount = await activityQuery.CountAsync(cancellationToken);
        var tasksAssigned = await dbContext.TaskAssignments.AsNoTracking()
            .CountAsync(assignment => assignment.UserId == targetUserId, cancellationToken);
        var tasksCompleted = await dbContext.Tasks.AsNoTracking()
            .CountAsync(task => task.Status == TaskStatus.Completed
                && dbContext.TaskAssignments.Any(a => a.TaskId == task.Id && a.UserId == targetUserId),
                cancellationToken);
        var commentsCount = await dbContext.TaskComments.AsNoTracking()
            .CountAsync(comment => comment.UserId == targetUserId, cancellationToken);
        var attachmentsCount = await dbContext.Attachments.AsNoTracking()
            .CountAsync(attachment => attachment.UploadedBy == targetUserId, cancellationToken);

        var user = await userManager.FindByIdAsync(targetUserId);
        var displayName = user is null ? targetUserId : $"{user.FirstName} {user.LastName}".Trim();

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "UserActivityReport", currentUserId, cancellationToken);

        return new UserActivityReportResponse(
            new ReportSummary(1, new Dictionary<string, int> { ["activity"] = activityCount }),
            [
                new UserActivityReportItem(
                    targetUserId,
                    displayName,
                    activityCount,
                    tasksAssigned,
                    tasksCompleted,
                    commentsCount,
                    attachmentsCount)
            ],
            1,
            1,
            1);
    }

    public async Task<TaskCompletionReportResponse> GetTaskCompletionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var completedTasks = tasks.Where(task => task.CompletedAt.HasValue);

        if (query.DateFrom.HasValue)
        {
            completedTasks = completedTasks.Where(task => task.CompletedAt >= query.DateFrom.Value);
        }

        if (query.DateTo.HasValue)
        {
            completedTasks = completedTasks.Where(task => task.CompletedAt <= query.DateTo.Value);
        }

        var completedTimestamps = await completedTasks
            .Select(task => task.CompletedAt!.Value)
            .ToListAsync(cancellationToken);

        var completionByDate = completedTimestamps
            .GroupBy(completedAt => DateOnly.FromDateTime(completedAt.UtcDateTime))
            .Select(group => new TaskCompletionReportItem(group.Key, group.Count(), 0))
            .OrderBy(item => item.Date)
            .ToList();

        var createdTimestamps = await tasks
            .Select(task => task.CreatedAt)
            .ToListAsync(cancellationToken);

        var createdByDate = createdTimestamps
            .GroupBy(createdAt => DateOnly.FromDateTime(createdAt.UtcDateTime))
            .Select(group => new { Date = group.Key, Count = group.Count() })
            .ToList();

        var merged = completionByDate
            .Select(item => item with
            {
                CreatedCount = createdByDate.FirstOrDefault(x => x.Date == item.Date)?.Count ?? 0
            })
            .ToList();

        var trend = new TrendChart(
            "line",
            merged.Select(item => new ChartDataPoint(item.Date.ToString("yyyy-MM-dd"), item.CompletedCount)).ToList());

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "TaskCompletionReport", currentUserId, cancellationToken);

        return new TaskCompletionReportResponse(
            new ReportSummary(merged.Sum(item => item.CompletedCount), new Dictionary<string, int>()),
            trend,
            merged,
            1,
            merged.Count,
            merged.Count);
    }

    public async Task<WorkloadReportResponse> GetWorkloadReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var today = ReportingQueryScope.Today;

        var workload = await (
            from assignment in dbContext.TaskAssignments.AsNoTracking()
            join task in tasks on assignment.TaskId equals task.Id
            group assignment by assignment.UserId into grouped
            select new
            {
                UserId = grouped.Key,
                Assigned = grouped.Count(),
                Completed = grouped.Count(a => a.Task.Status == TaskStatus.Completed),
                Overdue = grouped.Count(a =>
                    a.Task.DueDate.HasValue
                    && a.Task.DueDate.Value < today
                    && a.Task.Status != TaskStatus.Completed
                    && a.Task.Status != TaskStatus.Cancelled)
            }).ToListAsync(cancellationToken);

        var userIds = workload.Select(item => item.UserId).ToList();
        var users = await userManager.Users.AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var items = workload
            .Select(item =>
            {
                users.TryGetValue(item.UserId, out var user);
                var displayName = user is null ? item.UserId : $"{user.FirstName} {user.LastName}".Trim();
                var score = item.Assigned + item.Overdue * 2m;
                return new WorkloadReportItem(item.UserId, displayName, item.Assigned, item.Completed, item.Overdue, score);
            })
            .OrderByDescending(item => item.WorkloadScore)
            .ToList();

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var pagedItems = items.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "WorkloadReport", currentUserId, cancellationToken);

        return new WorkloadReportResponse(
            new ReportSummary(items.Count, new Dictionary<string, int>()),
            ReportingQueryScope.BuildDistribution("bar", items.Select(i => (i.DisplayName, i.AssignedTasks))),
            pagedItems,
            page,
            pageSize,
            items.Count);
    }

    public async Task<ProductivityReportResponse> GetProductivityReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        var periods = Enumerable.Range(0, 4)
            .Select(index =>
            {
                var start = now.AddDays(-7 * (index + 1));
                var end = now.AddDays(-7 * index);
                return new { Start = start, End = end, Label = $"Week -{index + 1}" };
            })
            .Reverse()
            .ToList();

        var items = new List<ProductivityReportItem>();
        foreach (var period in periods)
        {
            var created = await tasks.CountAsync(task => task.CreatedAt >= period.Start && task.CreatedAt < period.End, cancellationToken);
            var completed = await tasks.CountAsync(
                task => task.CompletedAt >= period.Start && task.CompletedAt < period.End,
                cancellationToken);
            var rate = created == 0 ? 0 : Math.Round(completed * 100m / created, 2);
            items.Add(new ProductivityReportItem(period.Label, completed, created, rate));
        }

        var trend = new TrendChart(
            "area",
            items.Select(item => new ChartDataPoint(item.Period, item.TasksCompleted)).ToList());

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "ProductivityReport", currentUserId, cancellationToken);

        return new ProductivityReportResponse(
            new ReportSummary(items.Sum(i => i.TasksCompleted), new Dictionary<string, int>()),
            trend,
            items,
            1,
            items.Count,
            items.Count);
    }

    public async Task<OverdueTasksReportResponse> GetOverdueTasksReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var today = ReportingQueryScope.Today;
        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        tasks = tasks.Where(task =>
            task.DueDate.HasValue
            && task.DueDate.Value < today
            && task.Status != TaskStatus.Completed
            && task.Status != TaskStatus.Cancelled);

        var totalCount = await tasks.CountAsync(cancellationToken);
        tasks = ApplyTaskSorting(tasks, query.SortBy ?? "dueDate", query.SortDescending);

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var rawItems = await tasks
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(task => new
            {
                task.Id,
                task.Title,
                task.ProjectId,
                ProjectName = task.Project.Name,
                task.DueDate,
                task.Priority
            })
            .ToListAsync(cancellationToken);

        var taskIds = rawItems.Select(item => item.Id).ToList();
        var assignments = await dbContext.TaskAssignments.AsNoTracking()
            .Where(assignment => taskIds.Contains(assignment.TaskId))
            .GroupBy(assignment => assignment.TaskId)
            .ToDictionaryAsync(
                group => group.Key,
                group => (IReadOnlyList<string>)group.Select(a => a.UserId).ToList(),
                cancellationToken);

        var items = rawItems.Select(item => new OverdueTaskReportItem(
            item.Id,
            item.Title,
            item.ProjectId,
            item.ProjectName,
            item.DueDate!.Value,
            today.DayNumber - item.DueDate.Value.DayNumber,
            item.Priority,
            assignments.GetValueOrDefault(item.Id, Array.Empty<string>()))).ToList();

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "OverdueTasksReport", currentUserId, cancellationToken);

        return new OverdueTasksReportResponse(
            new ReportSummary(totalCount, new Dictionary<string, int> { ["overdue"] = totalCount }),
            items,
            page,
            pageSize,
            totalCount);
    }

    public async Task<DistributionChart> GetPriorityDistributionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);
        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var groups = await tasks.GroupBy(task => task.Priority)
            .Select(group => new { Priority = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Report generated: priority distribution by user {UserId}", currentUserId);
        return ReportingQueryScope.BuildDistribution("pie", groups.Select(g => (g.Priority.ToString(), g.Count)));
    }

    public async Task<DistributionChart> GetStatusDistributionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);
        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var groups = await tasks.GroupBy(task => task.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Report generated: status distribution by user {UserId}", currentUserId);
        return ReportingQueryScope.BuildDistribution("bar", groups.Select(g => (g.Status.ToString(), g.Count)));
    }

    public async Task<StatisticsResponse> GetStatisticsAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        await reportingAccessService.EnsureCanGenerateReportAsync(currentUserId, query, cancellationToken);

        var tasks = await queryScope.GetAccessibleTasksAsync(currentUserId, query, cancellationToken);
        var projects = await queryScope.GetAccessibleProjectsAsync(currentUserId, query, cancellationToken);

        var tasksByStatus = await tasks.GroupBy(task => task.Status)
            .ToDictionaryAsync(group => group.Key.ToString(), group => group.Count(), cancellationToken);
        var tasksByPriority = await tasks.GroupBy(task => task.Priority)
            .ToDictionaryAsync(group => group.Key.ToString(), group => group.Count(), cancellationToken);
        var tasksByType = await tasks.GroupBy(task => task.Type)
            .ToDictionaryAsync(group => group.Key.ToString(), group => group.Count(), cancellationToken);

        var tasksByAssignee = await (
            from assignment in dbContext.TaskAssignments.AsNoTracking()
            join task in tasks on assignment.TaskId equals task.Id
            group assignment by assignment.UserId into grouped
            select new { UserId = grouped.Key, Count = grouped.Count() })
            .ToDictionaryAsync(entry => entry.UserId, entry => entry.Count, cancellationToken);

        var projectsByStatus = await projects.GroupBy(project => project.Status)
            .ToDictionaryAsync(group => group.Key.ToString(), group => group.Count(), cancellationToken);
        var projectsByOwner = await projects.GroupBy(project => project.OwnerId)
            .ToDictionaryAsync(group => group.Key, group => group.Count(), cancellationToken);

        var usersByRole = await dbContext.OrganizationMembers.AsNoTracking()
            .Where(member => !query.OrganizationId.HasValue || member.OrganizationId == query.OrganizationId.Value)
            .GroupBy(member => member.Role)
            .ToDictionaryAsync(group => group.Key.ToString(), group => group.Count(), cancellationToken);

        var commentsCount = await (
            from comment in dbContext.TaskComments.AsNoTracking()
            join task in tasks on comment.TaskId equals task.Id
            select comment).CountAsync(cancellationToken);
        var attachmentsCount = await (
            from attachment in dbContext.Attachments.AsNoTracking()
            join task in tasks on attachment.TaskId equals task.Id
            select attachment).CountAsync(cancellationToken);
        var notificationsCount = await dbContext.Notifications.AsNoTracking().CountAsync(cancellationToken);
        var activityCount = await dbContext.ActivityHistory.AsNoTracking().CountAsync(cancellationToken);
        var auditCount = await dbContext.AuditLogs.AsNoTracking().CountAsync(cancellationToken);

        stopwatch.Stop();
        await LogReportGeneratedAsync(stopwatch, "Statistics", currentUserId, cancellationToken);

        return new StatisticsResponse(
            tasksByStatus,
            tasksByPriority,
            tasksByType,
            tasksByAssignee,
            projectsByStatus,
            projectsByOwner,
            usersByRole,
            commentsCount,
            attachmentsCount,
            notificationsCount,
            activityCount,
            auditCount);
    }

    private async Task LogReportGeneratedAsync(
        Stopwatch stopwatch,
        string reportName,
        string userId,
        CancellationToken cancellationToken)
    {
        await ReportingQueryScope.LogSlowQueryAsync(logger, stopwatch, reportName, cancellationToken);
        logger.LogInformation("Report generated: {ReportName} by user {UserId}", reportName, userId);
    }

    private static IQueryable<Domain.Entities.TaskItem> ApplyTaskSorting(
        IQueryable<Domain.Entities.TaskItem> tasks,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "title" => sortDescending ? tasks.OrderByDescending(task => task.Title) : tasks.OrderBy(task => task.Title),
            "status" => sortDescending ? tasks.OrderByDescending(task => task.Status) : tasks.OrderBy(task => task.Status),
            "priority" => sortDescending ? tasks.OrderByDescending(task => task.Priority) : tasks.OrderBy(task => task.Priority),
            "duedate" => sortDescending ? tasks.OrderByDescending(task => task.DueDate) : tasks.OrderBy(task => task.DueDate),
            _ => sortDescending ? tasks.OrderByDescending(task => task.CreatedAt) : tasks.OrderBy(task => task.CreatedAt)
        };

    private static IQueryable<Domain.Entities.Project> ApplyProjectSorting(
        IQueryable<Domain.Entities.Project> projects,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "name" => sortDescending ? projects.OrderByDescending(project => project.Name) : projects.OrderBy(project => project.Name),
            "status" => sortDescending ? projects.OrderByDescending(project => project.Status) : projects.OrderBy(project => project.Status),
            _ => sortDescending ? projects.OrderByDescending(project => project.CreatedAt) : projects.OrderBy(project => project.CreatedAt)
        };

    private static IQueryable<Domain.Entities.Organization> ApplyOrganizationSorting(
        IQueryable<Domain.Entities.Organization> organizations,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "name" => sortDescending ? organizations.OrderByDescending(org => org.Name) : organizations.OrderBy(org => org.Name),
            _ => sortDescending ? organizations.OrderByDescending(org => org.CreatedAt) : organizations.OrderBy(org => org.CreatedAt)
        };
}
