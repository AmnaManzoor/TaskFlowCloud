import type {
  KpiCardViewModel,
  PersonalDashboardResponse,
  StatisticsResponse,
} from '@features/reports/models/report.models';
import type { DistributionChart, TrendChart } from '@features/dashboard/models/dashboard.models';
import { DateRangePreset } from '@features/reports/models/report.enums';
import type { ReportDateRange } from '@features/reports/models/report.models';

export function breakdownTotal(breakdown: Record<string, number>): number {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}

export function breakdownValue(breakdown: Record<string, number>, key: string): number {
  return breakdown[key] ?? 0;
}

export function chartToSeries(chart: DistributionChart | TrendChart | null | undefined): {
  labels: string[];
  values: number[];
} {
  if (!chart) {
    return { labels: [], values: [] };
  }

  const points = 'items' in chart ? chart.items : chart.dataPoints;
  return {
    labels: points.map((point) => point.label),
    values: points.map((point) => point.value),
  };
}

export function buildKpiCards(
  statistics: StatisticsResponse | null,
  personal: PersonalDashboardResponse | null,
  unreadCount: number,
): KpiCardViewModel[] {
  const taskTotal = breakdownTotal(statistics?.tasksByStatus ?? {});
  const projectTotal = breakdownTotal(statistics?.projectsByStatus ?? {});
  const completedTasks = breakdownValue(statistics?.tasksByStatus ?? {}, 'Completed');
  const openTasks = taskTotal - completedTasks;
  const userTotal = breakdownTotal(statistics?.usersByRole ?? {});
  const archivedProjects = breakdownValue(statistics?.projectsByStatus ?? {}, 'Archived');

  return [
    {
      id: 'organizations',
      icon: 'business',
      label: 'Organizations',
      value: statistics?.projectsByStatus ? Object.keys(statistics.projectsByStatus).length : 0,
      description: 'Scoped organizations',
    },
    {
      id: 'projects',
      icon: 'folder_open',
      label: 'Total Projects',
      value: projectTotal,
      description: 'Across workspace',
    },
    {
      id: 'tasks',
      icon: 'task',
      label: 'Total Tasks',
      value: taskTotal,
      description: 'All tracked tasks',
    },
    {
      id: 'completed-tasks',
      icon: 'task_alt',
      label: 'Completed Tasks',
      value: completedTasks,
      description: 'Marked complete',
      trendLabel: personal ? `${personal.productivity.completedThisWeek} this week` : undefined,
    },
    {
      id: 'overdue',
      icon: 'warning',
      label: 'Overdue Tasks',
      value: personal?.overdueTasks ?? 0,
      description: 'Past due date',
    },
    {
      id: 'active-users',
      icon: 'groups',
      label: 'Active Users',
      value: userTotal,
      description: 'Users in scope',
    },
    {
      id: 'completed-week',
      icon: 'trending_up',
      label: 'Completed This Week',
      value: personal?.productivity.completedThisWeek ?? 0,
      description: 'Personal productivity',
    },
    {
      id: 'completion-rate',
      icon: 'percent',
      label: 'Task Completion Rate',
      value: taskTotal > 0 ? Math.round((completedTasks / taskTotal) * 100) : 0,
      description: 'Completed / total (%)',
    },
    {
      id: 'open-tasks',
      icon: 'pending_actions',
      label: 'Open Tasks',
      value: openTasks,
      description: 'Not completed',
    },
    {
      id: 'archived-projects',
      icon: 'inventory_2',
      label: 'Archived Projects',
      value: archivedProjects,
      description: 'Archived status',
    },
    {
      id: 'notifications',
      icon: 'notifications',
      label: 'Unread Notifications',
      value: unreadCount,
      description: 'Requires attention',
    },
    {
      id: 'audit',
      icon: 'policy',
      label: 'Audit Events',
      value: statistics?.auditCount ?? 0,
      description: 'Security and change log',
    },
  ];
}

export function presetToDateRange(preset: DateRangePreset): ReportDateRange {
  const now = new Date();

  switch (preset) {
    case DateRangePreset.Week:
      return {
        preset,
        from: new Date(now.getTime() - 7 * 86_400_000).toISOString(),
        to: now.toISOString(),
      };
    case DateRangePreset.Month:
      return {
        preset,
        from: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
        to: now.toISOString(),
      };
    case DateRangePreset.Quarter:
      return {
        preset,
        from: new Date(now.getTime() - 90 * 86_400_000).toISOString(),
        to: now.toISOString(),
      };
    case DateRangePreset.Custom:
      return { preset, from: null, to: null };
    default:
      return { preset: DateRangePreset.All, from: null, to: null };
  }
}

export function filtersToQueryParams(
  filters: Record<string, string | number | boolean | undefined | null>,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value;
    }
  }
  return params;
}
