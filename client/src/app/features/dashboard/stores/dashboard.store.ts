import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { NotificationStore } from '@core/stores/notification.store';
import { DashboardService } from '@features/dashboard/services/dashboard.service';
import { breakdownValue } from '@features/dashboard/models/dashboard.utils';
import type {
  ActivityHistoryItem,
  CalendarEventViewModel,
  DashboardDateRange,
  NotificationItem,
  OverdueTaskReportItem,
  PersonalDashboardResponse,
  ProductivityReportResponse,
  ProjectReportItem,
  ProjectSummaryItem,
  ReportFilterQuery,
  StatCardViewModel,
  TaskReportItem,
  DistributionChart,
  TaskCompletionReportResponse,
  WorkloadReportResponse,
} from '@features/dashboard/models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationStore = inject(NotificationStore);

  private readonly _personal = signal<PersonalDashboardResponse | null>(null);
  private readonly _unreadCount = signal(0);
  private readonly _projectBreakdown = signal<Record<string, number>>({});
  private readonly _projectTotalCount = signal(0);
  private readonly _taskBreakdown = signal<Record<string, number>>({});
  private readonly _recentTasks = signal<TaskReportItem[]>([]);
  private readonly _recentProjects = signal<(ProjectSummaryItem | ProjectReportItem)[]>([]);
  private readonly _activity = signal<ActivityHistoryItem[]>([]);
  private readonly _notifications = signal<NotificationItem[]>([]);
  private readonly _statusChart = signal<DistributionChart | null>(null);
  private readonly _priorityChart = signal<DistributionChart | null>(null);
  private readonly _productivityReport = signal<ProductivityReportResponse | null>(null);
  private readonly _workloadReport = signal<WorkloadReportResponse | null>(null);
  private readonly _completionReport = signal<TaskCompletionReportResponse | null>(null);
  private readonly _overdueItems = signal<OverdueTaskReportItem[]>([]);
  private readonly _projectReportItems = signal<ProjectReportItem[]>([]);

  private readonly _loading = signal(false);
  private readonly _refreshing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<ReportFilterQuery>({});
  private readonly _dateRange = signal<DashboardDateRange>({ from: null, to: null });
  private readonly _selectedOrganizationId = signal<string | null>(null);
  private readonly _lastRefresh = signal<Date | null>(null);

  readonly personal = this._personal.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly recentTasks = this._recentTasks.asReadonly();
  readonly recentProjects = this._recentProjects.asReadonly();
  readonly activity = this._activity.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly statusChart = this._statusChart.asReadonly();
  readonly priorityChart = this._priorityChart.asReadonly();
  readonly productivityReport = this._productivityReport.asReadonly();
  readonly workloadReport = this._workloadReport.asReadonly();
  readonly completionReport = this._completionReport.asReadonly();
  readonly overdueItems = this._overdueItems.asReadonly();
  readonly projectReportItems = this._projectReportItems.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly refreshing = this._refreshing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly dateRange = this._dateRange.asReadonly();
  readonly selectedOrganizationId = this._selectedOrganizationId.asReadonly();
  readonly lastRefresh = this._lastRefresh.asReadonly();

  readonly hasData = computed(() => this._personal() !== null);
  readonly isEmpty = computed(() => !this._loading() && this._personal() !== null && this.statCards().every((c) => c.value === 0));

  readonly statCards = computed<StatCardViewModel[]>(() => {
    const personal = this._personal();
    const projectBreakdown = this._projectBreakdown();
    const projectTotal = this._projectTotalCount();
    const taskBreakdown = this._taskBreakdown();
    const unread = this._unreadCount();
    const productivity = personal?.productivity;

    return [
      {
        id: 'total-projects',
        icon: 'folder_open',
        label: 'Total Projects',
        value: projectTotal,
        description: 'Across your workspace',
        trendLabel: `${breakdownValue(projectBreakdown, 'Active')} active`,
        trendDirection: 'neutral',
      },
      {
        id: 'active-projects',
        icon: 'rocket_launch',
        label: 'Active Projects',
        value: breakdownValue(projectBreakdown, 'Active'),
        description: 'Currently in progress',
        trendDirection: 'up',
      },
      {
        id: 'completed-tasks',
        icon: 'task_alt',
        label: 'Completed Tasks',
        value: personal?.completedTasks ?? 0,
        description: 'Tasks you finished',
        trendLabel: productivity ? `${productivity.completedTotal} total` : undefined,
        trendDirection: 'up',
      },
      {
        id: 'pending-tasks',
        icon: 'pending_actions',
        label: 'Pending Tasks',
        value: breakdownValue(taskBreakdown, 'Todo'),
        description: 'Waiting to start',
        trendDirection: 'neutral',
      },
      {
        id: 'overdue-tasks',
        icon: 'warning_amber',
        label: 'Overdue Tasks',
        value: personal?.overdueTasks ?? 0,
        description: 'Past due date',
        trendDirection: personal && personal.overdueTasks > 0 ? 'down' : 'neutral',
      },
      {
        id: 'unread-notifications',
        icon: 'notifications',
        label: 'Unread Notifications',
        value: unread,
        description: 'Require your attention',
        trendDirection: unread > 0 ? 'up' : 'neutral',
      },
      {
        id: 'open-issues',
        icon: 'bug_report',
        label: 'Open Issues',
        value: breakdownValue(taskBreakdown, 'InProgress'),
        description: 'Tasks in progress',
        trendDirection: 'neutral',
      },
      {
        id: 'completed-week',
        icon: 'trending_up',
        label: 'Completed This Week',
        value: productivity?.completedThisWeek ?? 0,
        description: 'Last 7 days',
        trendLabel: productivity ? `${productivity.completedThisMonth} this month` : undefined,
        trendDirection: 'up',
      },
    ];
  });

  readonly calendarEvents = computed<CalendarEventViewModel[]>(() => {
    const personal = this._personal();
    const overdue = this._overdueItems();
    const events: CalendarEventViewModel[] = [];

    if (personal) {
      if (personal.tasksDueToday > 0) {
        events.push({
          id: 'due-today',
          title: `${personal.tasksDueToday} task${personal.tasksDueToday === 1 ? '' : 's'} due today`,
          subtitle: 'Today',
          date: new Date().toISOString(),
          type: 'task',
        });
      }
      if (personal.tasksDueThisWeek > 0) {
        events.push({
          id: 'due-week',
          title: `${personal.tasksDueThisWeek} task${personal.tasksDueThisWeek === 1 ? '' : 's'} due this week`,
          subtitle: 'This week',
          date: new Date().toISOString(),
          type: 'task',
        });
      }
    }

    for (const item of overdue.slice(0, 5)) {
      events.push({
        id: item.taskId,
        title: item.title,
        subtitle: `${item.projectName} · ${item.daysOverdue}d overdue`,
        date: item.dueDate,
        type: 'overdue',
        priority: item.priority,
      });
    }

    for (const project of this._projectReportItems().slice(0, 3)) {
      events.push({
        id: project.id,
        title: project.name,
        subtitle: `${project.completedTaskCount}/${project.taskCount} tasks complete`,
        date: project.createdAt,
        type: 'project',
      });
    }

    return events;
  });

  load(refresh = false): void {
    if (this._loading() || this._refreshing()) {
      return;
    }

    this._error.set(null);
    if (refresh) {
      this._refreshing.set(true);
    } else {
      this._loading.set(true);
    }

    const filters = this.buildFilters();

    this.dashboardService
      .loadDashboard(filters)
      .pipe(
        tap((bundle) => {
          this._personal.set(bundle.personal);
          this._unreadCount.set(bundle.notificationCount.unreadCount);
          this.notificationStore.setUnreadCount(bundle.notificationCount.unreadCount);
          this._projectBreakdown.set(bundle.projectReport.summary.breakdown);
          this._projectTotalCount.set(bundle.projectReport.summary.totalCount);
          this._taskBreakdown.set(bundle.taskReport.summary.breakdown);
          this._recentTasks.set(bundle.taskReport.items);
          this._recentProjects.set(
            bundle.personal.recentProjects.length > 0
              ? bundle.personal.recentProjects
              : bundle.projectReport.items,
          );
          this._projectReportItems.set(bundle.projectReport.items);
          this._activity.set(
            bundle.activity.items.length > 0 ? bundle.activity.items : bundle.personal.recentActivity,
          );
          this._notifications.set(
            bundle.notifications.items.length > 0
              ? bundle.notifications.items
              : bundle.personal.recentNotifications,
          );
          this._statusChart.set(bundle.statusChart);
          this._priorityChart.set(bundle.priorityChart);
          this._productivityReport.set(bundle.productivityReport);
          this._workloadReport.set(bundle.workloadReport);
          this._completionReport.set(bundle.completionReport);
          this._overdueItems.set(bundle.overdueReport.items);
          this._lastRefresh.set(new Date());
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load dashboard'));
          return of(null);
        }),
        finalize(() => {
          this._loading.set(false);
          this._refreshing.set(false);
        }),
      )
      .subscribe();
  }

  refresh(): void {
    this.load(true);
  }

  setDateRange(range: DashboardDateRange): void {
    this._dateRange.set(range);
    this.load(true);
  }

  setOrganizationId(organizationId: string | null): void {
    this._selectedOrganizationId.set(organizationId);
    this.load(true);
  }

  setFilters(filters: ReportFilterQuery): void {
    this._filters.set(filters);
    this.load(true);
  }

  markNotificationRead(id: string): void {
    this.dashboardService.markNotificationRead(id).subscribe({
      next: (updated) => {
        this._notifications.update((items) =>
          items.map((item) => (item.id === id ? updated : item)),
        );
        if (!updated.isRead) {
          return;
        }
        this._unreadCount.update((count) => Math.max(0, count - 1));
        this.notificationStore.setUnreadCount(this._unreadCount());
      },
    });
  }

  markAllNotificationsRead(): void {
    this.dashboardService.markAllNotificationsRead().subscribe({
      next: () => {
        this._notifications.update((items) =>
          items.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })),
        );
        this._unreadCount.set(0);
        this.notificationStore.setUnreadCount(0);
      },
    });
  }

  clearError(): void {
    this._error.set(null);
  }

  private buildFilters(): ReportFilterQuery {
    const range = this._dateRange();
    const orgId = this._selectedOrganizationId();

    return {
      ...this._filters(),
      ...(range.from ? { dateFrom: range.from } : {}),
      ...(range.to ? { dateTo: range.to } : {}),
      ...(orgId ? { organizationId: orgId } : {}),
    };
  }
}
