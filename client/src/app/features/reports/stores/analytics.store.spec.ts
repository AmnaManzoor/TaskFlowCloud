import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AnalyticsService } from '@features/reports/services/analytics.service';
import { AnalyticsStore } from '@features/reports/stores/analytics.store';
import { ExportStatus } from '@features/reports/models/report.enums';

describe('AnalyticsStore', () => {
  let store: AnalyticsStore;
  let loadSpy: jasmine.Spy;

  beforeEach(() => {
    loadSpy = jasmine.createSpy('loadAnalyticsDashboard');

    TestBed.configureTestingModule({
      providers: [
        AnalyticsStore,
        {
          provide: AnalyticsService,
          useValue: {
            loadAnalyticsDashboard: loadSpy,
            exportStatus: signal(ExportStatus.Idle),
            exportProgress: signal(0),
            exportTable: jasmine.createSpy('exportTable'),
          } satisfies Pick<AnalyticsService, 'loadAnalyticsDashboard' | 'exportStatus' | 'exportProgress' | 'exportTable'>,
        },
      ],
    });

    store = TestBed.inject(AnalyticsStore);
  });

  it('should load analytics dashboard', () => {
    loadSpy.and.returnValue(
      of({
        personal: {
          assignedTasks: 1,
          overdueTasks: 0,
          completedTasks: 1,
          tasksDueToday: 0,
          tasksDueThisWeek: 0,
          recentProjects: [],
          recentActivity: [],
          recentNotifications: [],
          productivity: {
            completedThisWeek: 1,
            completedThisMonth: 1,
            completedTotal: 1,
            totalEstimatedHours: null,
            totalActualHours: null,
          },
        },
        statistics: {
          tasksByStatus: { Completed: 1 },
          tasksByPriority: {},
          tasksByType: {},
          tasksByAssignee: {},
          projectsByStatus: { Active: 1 },
          projectsByOwner: {},
          usersByRole: { Member: 1 },
          commentsCount: 0,
          attachmentsCount: 0,
          notificationsCount: 0,
          activityCount: 0,
          auditCount: 0,
        },
        unreadCount: 0,
        statusChart: { chartType: 'bar', items: [] },
        priorityChart: { chartType: 'pie', items: [] },
        productivity: {
          summary: { totalCount: 0, breakdown: {} },
          productivityTrend: { chartType: 'line', dataPoints: [] },
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
        },
        workload: {
          summary: { totalCount: 0, breakdown: {} },
          workloadChart: { chartType: 'bar', items: [] },
          items: [],
          page: 1,
          pageSize: 10,
          totalCount: 0,
        },
        completion: {
          summary: { totalCount: 0, breakdown: {} },
          completionTrend: { chartType: 'line', dataPoints: [] },
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
        },
        taskReport: {
          summary: { totalCount: 0, breakdown: {} },
          statusChart: { chartType: 'bar', items: [] },
          priorityChart: { chartType: 'pie', items: [] },
          typeChart: { chartType: 'pie', items: [] },
          items: [],
          page: 1,
          pageSize: 8,
          totalCount: 0,
        },
        projectReport: {
          summary: { totalCount: 0, breakdown: {} },
          statusChart: { chartType: 'pie', items: [] },
          ownerChart: { chartType: 'bar', items: [] },
          items: [],
          page: 1,
          pageSize: 8,
          totalCount: 0,
        },
        activity: { items: [], page: 1, pageSize: 8, totalCount: 0, totalPages: 0 },
        audit: { items: [], page: 1, pageSize: 8, totalCount: 0, totalPages: 0 },
      }),
    );

    store.load();
    expect(store.loading()).toBeFalse();
    expect(store.kpiCards().length).toBeGreaterThan(0);
  });
});
