import type { TaskType } from '@features/reports/models/report.enums';
import type {
  ActivityHistoryItem,
  ChartDataPoint,
  DistributionChart,
  NotificationItem,
  OverdueTaskReportItem,
  PersonalDashboardResponse,
  ProductivityReportResponse,
  ProjectReportItem,
  ProjectReportResponse,
  ProjectSummaryItem,
  ReportFilterQuery,
  ReportSummary,
  StatisticsResponse,
  TaskCompletionReportResponse,
  TaskReportItem,
  TaskReportResponse,
  TaskPriority,
  TaskStatus,
  TrendChart,
  WorkloadReportItem,
  WorkloadReportResponse,
} from '@features/dashboard/models/dashboard.models';

export type {
  ActivityHistoryItem,
  ChartDataPoint,
  DistributionChart,
  NotificationItem,
  OverdueTaskReportItem,
  PersonalDashboardResponse,
  ProductivityReportResponse,
  ProjectReportItem,
  ProjectReportResponse,
  ProjectSummaryItem,
  ReportFilterQuery,
  ReportSummary,
  StatisticsResponse,
  TaskCompletionReportResponse,
  TaskReportItem,
  TaskReportResponse,
  TaskPriority,
  TaskStatus,
  TrendChart,
  WorkloadReportItem,
  WorkloadReportResponse,
};

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ReportFilters extends ReportFilterQuery {
  keyword?: string;
  includeArchived?: boolean;
}

export interface ReportDateRange {
  from: string | null;
  to: string | null;
  preset: string;
}

export interface OrganizationReportItem {
  id: string;
  name: string;
  isActive: boolean;
  projectCount: number;
  memberCount: number;
  teamCount: number;
  openTaskCount: number;
  createdAt: string;
}

export interface OrganizationReportResponse {
  summary: ReportSummary;
  items: OrganizationReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UserActivityReportItem {
  userId: string;
  displayName: string;
  activityCount: number;
  tasksAssigned: number;
  tasksCompleted: number;
  commentsCount: number;
  attachmentsCount: number;
}

export interface UserActivityReportResponse {
  summary: ReportSummary;
  items: UserActivityReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface OrganizationDashboardResponse {
  organizationId: string;
  organizationName: string;
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalUsers: number;
  activeUsers: number;
  teams: number;
  openTasks: number;
  completedTasks: number;
  productivity: {
    tasksCompletedThisWeek: number;
    tasksCompletedThisMonth: number;
    completionRate: number;
    activeProjects: number;
  };
}

export interface KpiCardViewModel {
  id: string;
  icon: string;
  label: string;
  value: number;
  description: string;
  trendLabel?: string;
}

export interface ReportNavItem {
  label: string;
  icon: string;
  route: string;
  description: string;
}

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (row: T) => string | number;
}

export interface AnalyticsBundle {
  personal: PersonalDashboardResponse;
  statistics: StatisticsResponse;
  unreadCount: number;
  statusChart: DistributionChart;
  priorityChart: DistributionChart;
  productivity: ProductivityReportResponse;
  workload: WorkloadReportResponse;
  completion: TaskCompletionReportResponse;
  taskReport: TaskReportResponse;
  projectReport: ProjectReportResponse;
  activity: PagedResult<ActivityHistoryItem>;
  audit: PagedResult<AuditLogItem>;
}

export interface ReportFilterQueryWithTaskType extends ReportFilterQuery {
  taskType?: TaskType;
}
