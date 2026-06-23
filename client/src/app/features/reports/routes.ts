import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/reports/components/reports-shell/reports-shell.component').then(
        (m) => m.ReportsShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/reports/pages/dashboard/analytics-dashboard-page.component').then(
            (m) => m.AnalyticsDashboardPageComponent,
          ),
        title: 'Analytics Dashboard',
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('@features/reports/pages/task-report/task-report-page.component').then(
            (m) => m.TaskReportPageComponent,
          ),
        title: 'Task Reports',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('@features/reports/pages/project-report/project-report-page.component').then(
            (m) => m.ProjectReportPageComponent,
          ),
        title: 'Project Reports',
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('@features/reports/pages/organization-report/organization-report-page.component').then(
            (m) => m.OrganizationReportPageComponent,
          ),
        title: 'Organization Reports',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('@features/reports/pages/user-report/user-report-page.component').then(
            (m) => m.UserReportPageComponent,
          ),
        title: 'User Productivity',
      },
      {
        path: 'workload',
        loadComponent: () =>
          import('@features/reports/pages/workload-report/workload-report-page.component').then(
            (m) => m.WorkloadReportPageComponent,
          ),
        title: 'Workload Analysis',
      },
      {
        path: 'productivity',
        loadComponent: () =>
          import('@features/reports/pages/productivity-report/productivity-report-page.component').then(
            (m) => m.ProductivityReportPageComponent,
          ),
        title: 'Productivity Report',
      },
      {
        path: 'completion',
        loadComponent: () =>
          import('@features/reports/pages/completion-report/completion-report-page.component').then(
            (m) => m.CompletionReportPageComponent,
          ),
        title: 'Completion Trends',
      },
      {
        path: 'priority',
        loadComponent: () =>
          import('@features/reports/pages/priority-report/priority-report-page.component').then(
            (m) => m.PriorityReportPageComponent,
          ),
        title: 'Priority Distribution',
      },
      {
        path: 'status',
        loadComponent: () =>
          import('@features/reports/pages/status-report/status-report-page.component').then(
            (m) => m.StatusReportPageComponent,
          ),
        title: 'Status Distribution',
      },
      {
        path: 'overdue',
        loadComponent: () =>
          import('@features/reports/pages/overdue-report/overdue-report-page.component').then(
            (m) => m.OverdueReportPageComponent,
          ),
        title: 'Overdue Tasks',
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('@features/reports/pages/activity-report/activity-report-page.component').then(
            (m) => m.ActivityReportPageComponent,
          ),
        title: 'Activity Report',
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('@features/reports/pages/audit-report/audit-report-page.component').then(
            (m) => m.AuditReportPageComponent,
          ),
        title: 'Audit Report',
      },
    ],
  },
];
