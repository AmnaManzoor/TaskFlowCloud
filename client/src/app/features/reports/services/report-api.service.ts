import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  ActivityHistoryItem,
  AuditLogItem,
  DistributionChart,
  OrganizationDashboardResponse,
  OrganizationReportResponse,
  PagedResult,
  PersonalDashboardResponse,
  ProductivityReportResponse,
  ReportFilterQuery,
  StatisticsResponse,
  TaskCompletionReportResponse,
  TaskReportResponse,
  UserActivityReportResponse,
  WorkloadReportResponse,
} from '@features/reports/models/report.models';
import type {
  OverdueTasksReportResponse,
  ProjectReportResponse,
} from '@features/dashboard/models/dashboard.models';
import type { NotificationCountResponse } from '@features/dashboard/models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class ReportApiService extends ApiBaseService {
  getPersonalDashboard(): Observable<PersonalDashboardResponse> {
    return this.get<PersonalDashboardResponse>('/dashboard/me', { skipLoading: true });
  }

  getOrganizationDashboard(organizationId: string): Observable<OrganizationDashboardResponse> {
    return this.get<OrganizationDashboardResponse>(`/dashboard/organization/${organizationId}`, {
      skipLoading: true,
    });
  }

  getStatistics(query: ReportFilterQuery = {}): Observable<StatisticsResponse> {
    return this.get<StatisticsResponse>('/reports/statistics', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getTaskReport(query: ReportFilterQuery = {}): Observable<TaskReportResponse> {
    return this.get<TaskReportResponse>('/reports/tasks', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getProjectReport(query: ReportFilterQuery = {}): Observable<ProjectReportResponse> {
    return this.get<ProjectReportResponse>('/reports/projects', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getOrganizationReport(query: ReportFilterQuery = {}): Observable<OrganizationReportResponse> {
    return this.get<OrganizationReportResponse>('/reports/organizations', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getUserReport(query: ReportFilterQuery = {}): Observable<UserActivityReportResponse> {
    return this.get<UserActivityReportResponse>('/reports/users', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getWorkloadReport(query: ReportFilterQuery = {}): Observable<WorkloadReportResponse> {
    return this.get<WorkloadReportResponse>('/reports/workload', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getProductivityReport(query: ReportFilterQuery = {}): Observable<ProductivityReportResponse> {
    return this.get<ProductivityReportResponse>('/reports/productivity', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getOverdueReport(query: ReportFilterQuery = {}): Observable<OverdueTasksReportResponse> {
    return this.get<OverdueTasksReportResponse>('/reports/overdue', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getCompletionReport(query: ReportFilterQuery = {}): Observable<TaskCompletionReportResponse> {
    return this.get<TaskCompletionReportResponse>('/reports/completion', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getPriorityDistribution(query: ReportFilterQuery = {}): Observable<DistributionChart> {
    return this.get<DistributionChart>('/reports/priority', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getStatusDistribution(query: ReportFilterQuery = {}): Observable<DistributionChart> {
    return this.get<DistributionChart>('/reports/status', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getActivityReport(query: ReportFilterQuery = {}): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>('/reports/activity', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getAuditReport(query: ReportFilterQuery = {}): Observable<PagedResult<AuditLogItem>> {
    return this.get<PagedResult<AuditLogItem>>('/reports/audit', {
      skipLoading: true,
      params: this.buildParams(query),
    });
  }

  getNotificationCount(): Observable<NotificationCountResponse> {
    return this.get<NotificationCountResponse>('/notifications/count', { skipLoading: true });
  }

  private buildParams(query: ReportFilterQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    if (query.page !== undefined) params['page'] = query.page;
    if (query.pageSize !== undefined) params['pageSize'] = query.pageSize;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.sortDescending !== undefined) params['sortDescending'] = query.sortDescending;
    if (query.dateFrom) params['dateFrom'] = query.dateFrom;
    if (query.dateTo) params['dateTo'] = query.dateTo;
    if (query.organizationId) params['organizationId'] = query.organizationId;
    if (query.projectId) params['projectId'] = query.projectId;
    if (query.userId) params['userId'] = query.userId;
    if (query.status !== undefined) params['status'] = query.status;
    if (query.priority !== undefined) params['priority'] = query.priority;
    return params;
  }
}
