using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.DTOs.Notifications;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Dashboard;

public sealed record ChartDataPoint(string Label, decimal Value, string? Category = null);

public sealed record ChartSeries(string Name, IReadOnlyList<ChartDataPoint> Data);

public sealed record DistributionChart(
    string ChartType,
    IReadOnlyList<ChartDataPoint> Items);

public sealed record TrendChart(
    string ChartType,
    IReadOnlyList<ChartDataPoint> DataPoints);

public sealed record ProductivitySummary(
    int CompletedThisWeek,
    int CompletedThisMonth,
    int CompletedTotal,
    decimal? TotalEstimatedHours,
    decimal? TotalActualHours);

public sealed record PersonalDashboardResponse(
    int AssignedTasks,
    int OverdueTasks,
    int CompletedTasks,
    int TasksDueToday,
    int TasksDueThisWeek,
    IReadOnlyList<ProjectSummaryItem> RecentProjects,
    IReadOnlyList<ActivityHistoryResponse> RecentActivity,
    IReadOnlyList<NotificationResponse> RecentNotifications,
    ProductivitySummary Productivity);

public sealed record ProjectSummaryItem(
    Guid Id,
    string Name,
    string Code,
    ProjectStatus Status,
    DateTimeOffset UpdatedAt);

public sealed record WorkloadItem(string UserId, string DisplayName, int TaskCount);

public sealed record ProjectDashboardResponse(
    Guid ProjectId,
    string ProjectName,
    int TotalTasks,
    int CompletedTasks,
    int PendingTasks,
    int InProgressTasks,
    int BlockedTasks,
    int OverdueTasks,
    decimal CompletionPercentage,
    int MemberCount,
    IReadOnlyList<WorkloadItem> WorkloadDistribution,
    DistributionChart TaskStatusDistribution,
    DistributionChart PriorityDistribution);

public sealed record OrganizationProductivity(
    int TasksCompletedThisWeek,
    int TasksCompletedThisMonth,
    decimal CompletionRate,
    int ActiveProjects);

public sealed record OrganizationDashboardResponse(
    Guid OrganizationId,
    string OrganizationName,
    int TotalProjects,
    int ActiveProjects,
    int ArchivedProjects,
    int TotalUsers,
    int ActiveUsers,
    int Teams,
    int OpenTasks,
    int CompletedTasks,
    OrganizationProductivity Productivity);

public sealed record ReportFilterQuery(
    int Page = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false,
    DateTimeOffset? DateFrom = null,
    DateTimeOffset? DateTo = null,
    Guid? OrganizationId = null,
    Guid? ProjectId = null,
    string? UserId = null,
    TaskStatus? Status = null,
    TaskPriority? Priority = null,
    TaskType? TaskType = null);

public sealed record ReportSummary(int TotalCount, IReadOnlyDictionary<string, int> Breakdown);

public sealed record TaskReportItem(
    Guid Id,
    string Title,
    TaskStatus Status,
    TaskPriority Priority,
    TaskType Type,
    Guid ProjectId,
    string ProjectName,
    DateOnly? DueDate,
    DateTimeOffset? CompletedAt,
    IReadOnlyList<string> AssigneeIds);

public sealed record TaskReportResponse(
    ReportSummary Summary,
    DistributionChart StatusChart,
    DistributionChart PriorityChart,
    DistributionChart TypeChart,
    IReadOnlyList<TaskReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record ProjectReportItem(
    Guid Id,
    string Name,
    string Code,
    ProjectStatus Status,
    ProjectPriority Priority,
    int TaskCount,
    int CompletedTaskCount,
    string OwnerId,
    DateTimeOffset CreatedAt);

public sealed record ProjectReportResponse(
    ReportSummary Summary,
    DistributionChart StatusChart,
    DistributionChart OwnerChart,
    IReadOnlyList<ProjectReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record OrganizationReportItem(
    Guid Id,
    string Name,
    bool IsActive,
    int ProjectCount,
    int MemberCount,
    int TeamCount,
    int OpenTaskCount,
    DateTimeOffset CreatedAt);

public sealed record OrganizationReportResponse(
    ReportSummary Summary,
    IReadOnlyList<OrganizationReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record UserActivityReportItem(
    string UserId,
    string DisplayName,
    int ActivityCount,
    int TasksAssigned,
    int TasksCompleted,
    int CommentsCount,
    int AttachmentsCount);

public sealed record UserActivityReportResponse(
    ReportSummary Summary,
    IReadOnlyList<UserActivityReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record TaskCompletionReportItem(
    DateOnly Date,
    int CompletedCount,
    int CreatedCount);

public sealed record TaskCompletionReportResponse(
    ReportSummary Summary,
    TrendChart CompletionTrend,
    IReadOnlyList<TaskCompletionReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record WorkloadReportItem(
    string UserId,
    string DisplayName,
    int AssignedTasks,
    int CompletedTasks,
    int OverdueTasks,
    decimal WorkloadScore);

public sealed record WorkloadReportResponse(
    ReportSummary Summary,
    DistributionChart WorkloadChart,
    IReadOnlyList<WorkloadReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record ProductivityReportItem(
    string Period,
    int TasksCompleted,
    int TasksCreated,
    decimal CompletionRate);

public sealed record ProductivityReportResponse(
    ReportSummary Summary,
    TrendChart ProductivityTrend,
    IReadOnlyList<ProductivityReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record OverdueTaskReportItem(
    Guid TaskId,
    string Title,
    Guid ProjectId,
    string ProjectName,
    DateOnly DueDate,
    int DaysOverdue,
    TaskPriority Priority,
    IReadOnlyList<string> AssigneeIds);

public sealed record OverdueTasksReportResponse(
    ReportSummary Summary,
    IReadOnlyList<OverdueTaskReportItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record StatisticsResponse(
    IReadOnlyDictionary<string, int> TasksByStatus,
    IReadOnlyDictionary<string, int> TasksByPriority,
    IReadOnlyDictionary<string, int> TasksByType,
    IReadOnlyDictionary<string, int> TasksByAssignee,
    IReadOnlyDictionary<string, int> ProjectsByStatus,
    IReadOnlyDictionary<string, int> ProjectsByOwner,
    IReadOnlyDictionary<string, int> UsersByRole,
    int CommentsCount,
    int AttachmentsCount,
    int NotificationsCount,
    int ActivityCount,
    int AuditCount);
