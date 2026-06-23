import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { AnalyticsService } from '@features/reports/services/analytics.service';
import { DateRangePreset } from '@features/reports/models/report.enums';
import type {
  ActivityHistoryItem,
  AuditLogItem,
  KpiCardViewModel,
  PersonalDashboardResponse,
  ProjectReportItem,
  ReportDateRange,
  ReportFilters,
  StatisticsResponse,
  TaskReportItem,
} from '@features/reports/models/report.models';
import type {
  DistributionChart,
  ProductivityReportResponse,
  TaskCompletionReportResponse,
  WorkloadReportResponse,
} from '@features/dashboard/models/dashboard.models';
import { buildKpiCards, chartToSeries, presetToDateRange } from '@features/reports/models/report.utils';

@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  private readonly analyticsService = inject(AnalyticsService);

  private readonly _personal = signal<PersonalDashboardResponse | null>(null);
  private readonly _statistics = signal<StatisticsResponse | null>(null);
  private readonly _unreadCount = signal(0);
  private readonly _statusChart = signal<DistributionChart | null>(null);
  private readonly _priorityChart = signal<DistributionChart | null>(null);
  private readonly _productivity = signal<ProductivityReportResponse | null>(null);
  private readonly _workload = signal<WorkloadReportResponse | null>(null);
  private readonly _completion = signal<TaskCompletionReportResponse | null>(null);
  private readonly _recentTasks = signal<TaskReportItem[]>([]);
  private readonly _recentProjects = signal<ProjectReportItem[]>([]);
  private readonly _recentActivity = signal<ActivityHistoryItem[]>([]);
  private readonly _recentAudit = signal<AuditLogItem[]>([]);
  private readonly _filters = signal<ReportFilters>({});
  private readonly _dateRange = signal<ReportDateRange>(presetToDateRange(DateRangePreset.All));
  private readonly _selectedOrganizationId = signal<string | null>(null);
  private readonly _selectedProjectId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _refreshing = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly personal = this._personal.asReadonly();
  readonly statistics = this._statistics.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly statusChart = this._statusChart.asReadonly();
  readonly priorityChart = this._priorityChart.asReadonly();
  readonly productivity = this._productivity.asReadonly();
  readonly workload = this._workload.asReadonly();
  readonly completion = this._completion.asReadonly();
  readonly recentTasks = this._recentTasks.asReadonly();
  readonly recentProjects = this._recentProjects.asReadonly();
  readonly recentActivity = this._recentActivity.asReadonly();
  readonly recentAudit = this._recentAudit.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly dateRange = this._dateRange.asReadonly();
  readonly selectedOrganizationId = this._selectedOrganizationId.asReadonly();
  readonly selectedProjectId = this._selectedProjectId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly refreshing = this._refreshing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly exportStatus = this.analyticsService.exportStatus;
  readonly exportProgress = this.analyticsService.exportProgress;

  readonly kpiCards = computed<KpiCardViewModel[]>(() =>
    buildKpiCards(this._statistics(), this._personal(), this._unreadCount()),
  );

  readonly statusSeries = computed(() => chartToSeries(this._statusChart()));
  readonly prioritySeries = computed(() => chartToSeries(this._priorityChart()));
  readonly productivitySeries = computed(() =>
    chartToSeries(this._productivity()?.productivityTrend ?? null),
  );
  readonly completionSeries = computed(() =>
    chartToSeries(this._completion()?.completionTrend ?? null),
  );
  readonly workloadSeries = computed(() => chartToSeries(this._workload()?.workloadChart ?? null));

  load(refresh = false): void {
    if (this._loading() || this._refreshing()) return;

    this._error.set(null);
    refresh ? this._refreshing.set(true) : this._loading.set(true);

    this.analyticsService
      .loadAnalyticsDashboard(this.buildQuery())
      .pipe(
        tap((bundle) => {
          this._personal.set(bundle.personal);
          this._statistics.set(bundle.statistics);
          this._unreadCount.set(bundle.unreadCount);
          this._statusChart.set(bundle.statusChart);
          this._priorityChart.set(bundle.priorityChart);
          this._productivity.set(bundle.productivity);
          this._workload.set(bundle.workload);
          this._completion.set(bundle.completion);
          this._recentTasks.set(bundle.taskReport.items);
          this._recentProjects.set(bundle.projectReport.items);
          this._recentActivity.set(bundle.activity.items);
          this._recentAudit.set(bundle.audit.items);
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load analytics dashboard'));
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

  setFilters(filters: Partial<ReportFilters>): void {
    this._filters.update((current) => ({ ...current, ...filters }));
    this.load(true);
  }

  setDateRangePreset(preset: DateRangePreset): void {
    this._dateRange.set(presetToDateRange(preset));
    this.load(true);
  }

  setCustomDateRange(range: ReportDateRange): void {
    this._dateRange.set(range);
    this.load(true);
  }

  setOrganizationId(organizationId: string | null): void {
    this._selectedOrganizationId.set(organizationId);
    this.load(true);
  }

  setProjectId(projectId: string | null): void {
    this._selectedProjectId.set(projectId);
    this.load(true);
  }

  private buildQuery(): ReportFilters {
    const range = this._dateRange();
    return {
      ...this._filters(),
      ...(range.from ? { dateFrom: range.from } : {}),
      ...(range.to ? { dateTo: range.to } : {}),
      ...(this._selectedOrganizationId()
        ? { organizationId: this._selectedOrganizationId()! }
        : {}),
      ...(this._selectedProjectId() ? { projectId: this._selectedProjectId()! } : {}),
    };
  }
}
