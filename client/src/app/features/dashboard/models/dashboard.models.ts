export enum ProjectStatus {
  Draft = 0,
  Active = 1,
  OnHold = 2,
  Completed = 3,
  Cancelled = 4,
  Archived = 5,
}

export enum ProjectPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum TaskStatus {
  Backlog = 0,
  Todo = 1,
  InProgress = 2,
  InReview = 3,
  Blocked = 4,
  Completed = 5,
  Cancelled = 6,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum NotificationType {
  TaskAssigned = 0,
  TaskUnassigned = 1,
  TaskUpdated = 2,
  TaskCompleted = 3,
  TaskReopened = 4,
  TaskPriorityChanged = 5,
  TaskDueDateChanged = 6,
  TaskCommentAdded = 7,
  MentionedInComment = 8,
  ProjectCreated = 9,
  ProjectUpdated = 10,
  ProjectArchived = 11,
  ProjectOwnershipTransferred = 12,
  OrganizationInvitation = 13,
  RoleChanged = 14,
  TeamMemberAdded = 15,
  SystemNotification = 16,
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string | null;
}

export interface DistributionChart {
  chartType: string;
  items: ChartDataPoint[];
}

export interface TrendChart {
  chartType: string;
  dataPoints: ChartDataPoint[];
}

export interface ProductivitySummary {
  completedThisWeek: number;
  completedThisMonth: number;
  completedTotal: number;
  totalEstimatedHours: number | null;
  totalActualHours: number | null;
}

export interface ProjectSummaryItem {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  updatedAt: string;
}

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PersonalDashboardResponse {
  assignedTasks: number;
  overdueTasks: number;
  completedTasks: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  recentProjects: ProjectSummaryItem[];
  recentActivity: ActivityHistoryItem[];
  recentNotifications: NotificationItem[];
  productivity: ProductivitySummary;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ReportSummary {
  totalCount: number;
  breakdown: Record<string, number>;
}

export interface TaskReportItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: number;
  projectId: string;
  projectName: string;
  dueDate: string | null;
  completedAt: string | null;
  assigneeIds: string[];
}

export interface TaskReportResponse {
  summary: ReportSummary;
  statusChart: DistributionChart;
  priorityChart: DistributionChart;
  typeChart: DistributionChart;
  items: TaskReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ProjectReportItem {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  taskCount: number;
  completedTaskCount: number;
  ownerId: string;
  createdAt: string;
}

export interface ProjectReportResponse {
  summary: ReportSummary;
  statusChart: DistributionChart;
  ownerChart: DistributionChart;
  items: ProjectReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface WorkloadReportItem {
  userId: string;
  displayName: string;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  workloadScore: number;
}

export interface WorkloadReportResponse {
  summary: ReportSummary;
  workloadChart: DistributionChart;
  items: WorkloadReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ProductivityReportItem {
  period: string;
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
}

export interface ProductivityReportResponse {
  summary: ReportSummary;
  productivityTrend: TrendChart;
  items: ProductivityReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface TaskCompletionReportItem {
  date: string;
  completedCount: number;
  createdCount: number;
}

export interface TaskCompletionReportResponse {
  summary: ReportSummary;
  completionTrend: TrendChart;
  items: TaskCompletionReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OverdueTaskReportItem {
  taskId: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string;
  daysOverdue: number;
  priority: TaskPriority;
  assigneeIds: string[];
}

export interface OverdueTasksReportResponse {
  summary: ReportSummary;
  items: OverdueTaskReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface StatisticsResponse {
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByType: Record<string, number>;
  tasksByAssignee: Record<string, number>;
  projectsByStatus: Record<string, number>;
  projectsByOwner: Record<string, number>;
  usersByRole: Record<string, number>;
  commentsCount: number;
  attachmentsCount: number;
  notificationsCount: number;
  activityCount: number;
  auditCount: number;
}

export interface ReportFilterQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  projectId?: string;
  userId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface DashboardDateRange {
  from: string | null;
  to: string | null;
}

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardViewModel {
  id: string;
  icon: string;
  label: string;
  value: number;
  description: string;
  trendLabel?: string;
  trendDirection?: TrendDirection;
}

export interface CalendarEventViewModel {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: 'task' | 'project' | 'overdue';
  priority?: TaskPriority;
}
