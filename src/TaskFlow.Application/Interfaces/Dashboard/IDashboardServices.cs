using TaskFlow.Application.DTOs.Dashboard;

namespace TaskFlow.Application.Interfaces.Dashboard;

public interface IReportingAccessService
{
    Task EnsureCanViewPersonalDashboardAsync(string currentUserId, CancellationToken cancellationToken = default);

    Task EnsureCanViewProjectDashboardAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanViewOrganizationDashboardAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task EnsureCanGenerateOrganizationReportAsync(
        string currentUserId,
        Guid? organizationId,
        CancellationToken cancellationToken = default);

    Task EnsureCanGenerateReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);
}

public interface IDashboardService
{
    Task<PersonalDashboardResponse> GetPersonalDashboardAsync(
        string currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectDashboardResponse> GetProjectDashboardAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<OrganizationDashboardResponse> GetOrganizationDashboardAsync(
        string currentUserId,
        Guid organizationId,
        CancellationToken cancellationToken = default);
}

public interface IReportService
{
    Task<TaskReportResponse> GetTaskReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<ProjectReportResponse> GetProjectReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<OrganizationReportResponse> GetOrganizationReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<UserActivityReportResponse> GetUserActivityReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<TaskCompletionReportResponse> GetTaskCompletionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<WorkloadReportResponse> GetWorkloadReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<ProductivityReportResponse> GetProductivityReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<OverdueTasksReportResponse> GetOverdueTasksReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<DistributionChart> GetPriorityDistributionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<DistributionChart> GetStatusDistributionReportAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);

    Task<StatisticsResponse> GetStatisticsAsync(
        string currentUserId,
        ReportFilterQuery query,
        CancellationToken cancellationToken = default);
}
