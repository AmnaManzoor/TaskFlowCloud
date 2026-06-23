import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  ActivityHistoryItem,
  NotificationCountResponse,
  NotificationItem,
  OverdueTasksReportResponse,
  PagedResult,
  PersonalDashboardResponse,
  ProductivityReportResponse,
  ProjectReportResponse,
  ReportFilterQuery,
  StatisticsResponse,
  TaskCompletionReportResponse,
  TaskReportResponse,
  WorkloadReportResponse,
  DistributionChart,
} from '@features/dashboard/models/dashboard.models';

export interface DashboardBundle {
  personal: PersonalDashboardResponse;
  notificationCount: NotificationCountResponse;
  statistics: StatisticsResponse;
  taskReport: TaskReportResponse;
  projectReport: ProjectReportResponse;
  statusChart: DistributionChart;
  priorityChart: DistributionChart;
  productivityReport: ProductivityReportResponse;
  workloadReport: WorkloadReportResponse;
  completionReport: TaskCompletionReportResponse;
  activity: PagedResult<ActivityHistoryItem>;
  notifications: PagedResult<NotificationItem>;
  overdueReport: OverdueTasksReportResponse;
}

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiBaseService {
  loadDashboard(filters: ReportFilterQuery = {}): Observable<DashboardBundle> {
    const query = this.toQueryParams(filters);
    const skip = { skipLoading: true };

    return forkJoin({
      personal: this.get<PersonalDashboardResponse>('/dashboard/me', skip),
      notificationCount: this.get<NotificationCountResponse>('/notifications/count', skip),
      statistics: this.get<StatisticsResponse>('/reports/statistics', { ...skip, params: query }),
      taskReport: this.get<TaskReportResponse>('/reports/tasks', {
        ...skip,
        params: { ...query, pageSize: 5, sortBy: 'dueDate', sortDescending: false },
      }),
      projectReport: this.get<ProjectReportResponse>('/reports/projects', {
        ...skip,
        params: { ...query, pageSize: 5, sortBy: 'createdAt', sortDescending: true },
      }),
      statusChart: this.get<DistributionChart>('/reports/status', { ...skip, params: query }),
      priorityChart: this.get<DistributionChart>('/reports/priority', { ...skip, params: query }),
      productivityReport: this.get<ProductivityReportResponse>('/reports/productivity', {
        ...skip,
        params: query,
      }),
      workloadReport: this.get<WorkloadReportResponse>('/reports/workload', {
        ...skip,
        params: { ...query, pageSize: 10 },
      }),
      completionReport: this.get<TaskCompletionReportResponse>('/reports/completion', {
        ...skip,
        params: query,
      }),
      activity: this.get<PagedResult<ActivityHistoryItem>>('/activity', {
        ...skip,
        params: { page: 1, pageSize: 10, sortDescending: true },
      }),
      notifications: this.get<PagedResult<NotificationItem>>('/notifications', {
        ...skip,
        params: { page: 1, pageSize: 5, sortDescending: true },
      }),
      overdueReport: this.get<OverdueTasksReportResponse>('/reports/overdue', {
        ...skip,
        params: { ...query, pageSize: 10, sortBy: 'dueDate', sortDescending: false },
      }),
    });
  }

  markNotificationRead(id: string): Observable<NotificationItem> {
    return this.patch<NotificationItem>(`/notifications/${id}/read`, {}, { skipLoading: true });
  }

  markAllNotificationsRead(): Observable<{ count: number }> {
    return this.patch<{ count: number }>('/notifications/read-all', {}, { skipLoading: true });
  }

  private toQueryParams(filters: ReportFilterQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};

    if (filters.page !== undefined) {
      params['page'] = filters.page;
    }
    if (filters.pageSize !== undefined) {
      params['pageSize'] = filters.pageSize;
    }
    if (filters.sortBy) {
      params['sortBy'] = filters.sortBy;
    }
    if (filters.sortDescending !== undefined) {
      params['sortDescending'] = filters.sortDescending;
    }
    if (filters.dateFrom) {
      params['dateFrom'] = filters.dateFrom;
    }
    if (filters.dateTo) {
      params['dateTo'] = filters.dateTo;
    }
    if (filters.organizationId) {
      params['organizationId'] = filters.organizationId;
    }
    if (filters.projectId) {
      params['projectId'] = filters.projectId;
    }
    if (filters.userId) {
      params['userId'] = filters.userId;
    }
    if (filters.status !== undefined) {
      params['status'] = filters.status;
    }
    if (filters.priority !== undefined) {
      params['priority'] = filters.priority;
    }

    return params;
  }
}
