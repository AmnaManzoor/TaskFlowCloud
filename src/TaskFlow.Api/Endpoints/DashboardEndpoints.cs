using System.Security.Claims;
using TaskFlow.Api.Filters;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.DTOs.Audit;
using TaskFlow.Application.DTOs.Dashboard;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Dashboard;

namespace TaskFlow.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var dashboardGroup = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        dashboardGroup.MapGet("/me", GetPersonalDashboardAsync)
            .WithSummary("Get personal dashboard")
            .WithDescription("Returns assigned tasks, overdue counts, recent activity, and productivity summary for the current user.");

        dashboardGroup.MapGet("/project/{projectId:guid}", GetProjectDashboardAsync)
            .WithSummary("Get project dashboard")
            .WithDescription("Returns task statistics, workload distribution, and chart data for a project.");

        dashboardGroup.MapGet("/organization/{organizationId:guid}", GetOrganizationDashboardAsync)
            .WithSummary("Get organization dashboard")
            .WithDescription("Returns organization-wide KPIs. Requires Manager, Administrator, or Owner role.");

        var reportGroup = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .RequireAuthorization(AuthorizationPolicies.RequireAuthenticated);

        reportGroup.MapGet("/tasks", GetTaskReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Task report with charts and pagination");

        reportGroup.MapGet("/projects", GetProjectReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Project report with status distribution");

        reportGroup.MapGet("/organizations", GetOrganizationReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Organization report");

        reportGroup.MapGet("/users", GetUserActivityReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("User activity report");

        reportGroup.MapGet("/workload", GetWorkloadReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Workload distribution report");

        reportGroup.MapGet("/productivity", GetProductivityReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Productivity trend report");

        reportGroup.MapGet("/overdue", GetOverdueTasksReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Overdue tasks report");

        reportGroup.MapGet("/completion", GetTaskCompletionReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Task completion trend report");

        reportGroup.MapGet("/priority", GetPriorityDistributionReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Priority distribution chart data");

        reportGroup.MapGet("/status", GetStatusDistributionReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Status distribution chart data");

        reportGroup.MapGet("/statistics", GetStatisticsAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Aggregate statistics");

        reportGroup.MapGet("/activity", GetActivityReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Activity history report");

        reportGroup.MapGet("/audit", GetAuditReportAsync)
            .AddEndpointFilter<ValidationFilter<ReportFilterQuery>>()
            .WithSummary("Audit log report");

        return app;
    }

    private static async Task<IResult> GetPersonalDashboardAsync(
        IDashboardService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetPersonalDashboardAsync(GetUserId(user), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetProjectDashboardAsync(
        Guid projectId,
        IDashboardService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetProjectDashboardAsync(GetUserId(user), projectId, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetOrganizationDashboardAsync(
        Guid organizationId,
        IDashboardService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetOrganizationDashboardAsync(GetUserId(user), organizationId, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetTaskReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetTaskReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetProjectReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetProjectReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetOrganizationReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetOrganizationReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetUserActivityReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetUserActivityReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetWorkloadReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetWorkloadReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetProductivityReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetProductivityReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetOverdueTasksReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetOverdueTasksReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetTaskCompletionReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetTaskCompletionReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetPriorityDistributionReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetPriorityDistributionReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetStatusDistributionReportAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetStatusDistributionReportAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetStatisticsAsync(
        [AsParameters] ReportFilterQuery query,
        IReportService service,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var response = await service.GetStatisticsAsync(GetUserId(user), query, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetActivityReportAsync(
        [AsParameters] ReportFilterQuery query,
        IActivityHistoryService activityService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        var activityQuery = new ActivityHistoryListQuery(
            query.Page,
            query.PageSize,
            query.SortBy,
            query.SortDescending,
            CreatedFrom: query.DateFrom,
            CreatedTo: query.DateTo);

        var response = string.IsNullOrWhiteSpace(query.UserId) || query.UserId == userId
            ? await activityService.GetMyActivityAsync(userId, activityQuery, cancellationToken)
            : await activityService.GetByUserAsync(userId, query.UserId, activityQuery, cancellationToken);

        return Results.Ok(response);
    }

    private static async Task<IResult> GetAuditReportAsync(
        [AsParameters] ReportFilterQuery query,
        IAuditLogService auditService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var auditQuery = new AuditLogListQuery(
            query.Page,
            query.PageSize,
            query.SortBy,
            query.SortDescending,
            UserId: query.UserId,
            CreatedFrom: query.DateFrom,
            CreatedTo: query.DateTo,
            OrganizationId: query.OrganizationId);

        var response = await auditService.SearchAsync(GetUserId(user), auditQuery, cancellationToken);
        return Results.Ok(response);
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(CustomClaimTypes.UserId)
        ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier was not found in the token.");
}
