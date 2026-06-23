import type { ReportNavItem } from '@features/reports/models/report.models';

export const REPORT_NAV_ITEMS: ReportNavItem[] = [
  { label: 'Analytics Dashboard', icon: 'dashboard', route: '/reports/dashboard', description: 'KPI overview' },
  { label: 'Task Reports', icon: 'task_alt', route: '/reports/tasks', description: 'Task analytics' },
  { label: 'Project Reports', icon: 'folder', route: '/reports/projects', description: 'Project analytics' },
  { label: 'Organization Reports', icon: 'business', route: '/reports/organizations', description: 'Org metrics' },
  { label: 'User Productivity', icon: 'person', route: '/reports/users', description: 'User activity' },
  { label: 'Workload Analysis', icon: 'stacked_bar_chart', route: '/reports/workload', description: 'Team workload' },
  { label: 'Productivity', icon: 'trending_up', route: '/reports/productivity', description: 'Completion trends' },
  { label: 'Completion Trends', icon: 'show_chart', route: '/reports/completion', description: 'Daily completion' },
  { label: 'Priority Distribution', icon: 'flag', route: '/reports/priority', description: 'Priority breakdown' },
  { label: 'Status Distribution', icon: 'donut_large', route: '/reports/status', description: 'Status breakdown' },
  { label: 'Overdue Tasks', icon: 'warning', route: '/reports/overdue', description: 'Overdue analysis' },
  { label: 'Activity Report', icon: 'history', route: '/reports/activity', description: 'Workspace activity' },
  { label: 'Audit Report', icon: 'policy', route: '/reports/audit', description: 'Audit trail' },
];
