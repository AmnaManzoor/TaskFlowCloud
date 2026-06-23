import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationStore } from '@core/stores/notification.store';
import { DashboardService } from '@features/dashboard/services/dashboard.service';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

describe('DashboardStore', () => {
  let store: DashboardStore;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(() => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'loadDashboard',
      'markNotificationRead',
      'markAllNotificationsRead',
    ]);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: NotificationStore,
          useValue: jasmine.createSpyObj('NotificationStore', ['setUnreadCount']),
        },
      ],
    });

    store = TestBed.inject(DashboardStore);
  });

  it('should start in idle state', () => {
    expect(store.loading()).toBeFalse();
    expect(store.hasData()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should load dashboard data', () => {
    dashboardService.loadDashboard.and.returnValue(
      of({
        personal: {
          assignedTasks: 4,
          overdueTasks: 1,
          completedTasks: 10,
          tasksDueToday: 2,
          tasksDueThisWeek: 5,
          recentProjects: [],
          recentActivity: [],
          recentNotifications: [],
          productivity: {
            completedThisWeek: 3,
            completedThisMonth: 8,
            completedTotal: 10,
            totalEstimatedHours: null,
            totalActualHours: null,
          },
        },
        notificationCount: { unreadCount: 2 },
        statistics: {
          tasksByStatus: {},
          tasksByPriority: {},
          tasksByType: {},
          tasksByAssignee: {},
          projectsByStatus: {},
          projectsByOwner: {},
          usersByRole: {},
          commentsCount: 0,
          attachmentsCount: 0,
          notificationsCount: 0,
          activityCount: 0,
          auditCount: 0,
        },
        taskReport: {
          summary: { totalCount: 4, breakdown: { Todo: 2, InProgress: 1 } },
          statusChart: { chartType: 'bar', items: [] },
          priorityChart: { chartType: 'pie', items: [] },
          typeChart: { chartType: 'pie', items: [] },
          items: [],
          page: 1,
          pageSize: 5,
          totalCount: 0,
        },
        projectReport: {
          summary: { totalCount: 3, breakdown: { Active: 2 } },
          statusChart: { chartType: 'pie', items: [] },
          ownerChart: { chartType: 'bar', items: [] },
          items: [],
          page: 1,
          pageSize: 5,
          totalCount: 0,
        },
        statusChart: { chartType: 'bar', items: [{ label: 'Todo', value: 2 }] },
        priorityChart: { chartType: 'pie', items: [] },
        productivityReport: {
          summary: { totalCount: 0, breakdown: {} },
          productivityTrend: { chartType: 'line', dataPoints: [] },
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
        },
        workloadReport: {
          summary: { totalCount: 0, breakdown: {} },
          workloadChart: { chartType: 'bar', items: [] },
          items: [],
          page: 1,
          pageSize: 10,
          totalCount: 0,
        },
        completionReport: {
          summary: { totalCount: 0, breakdown: {} },
          completionTrend: { chartType: 'line', dataPoints: [] },
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
        },
        activity: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        notifications: { items: [], page: 1, pageSize: 5, totalCount: 0, totalPages: 0 },
        overdueReport: {
          summary: { totalCount: 0, breakdown: {} },
          items: [],
          page: 1,
          pageSize: 10,
          totalCount: 0,
        },
      }),
    );

    store.load();

    expect(store.loading()).toBeFalse();
    expect(store.hasData()).toBeTrue();
    expect(store.unreadCount()).toBe(2);
    expect(store.statCards().length).toBe(8);
  });
});
