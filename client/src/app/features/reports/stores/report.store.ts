import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { ReportApiService } from '@features/reports/services/report-api.service';
import { AnalyticsService } from '@features/reports/services/analytics.service';
import { DateRangePreset, ExportFormat, ReportType } from '@features/reports/models/report.enums';
import type {
  ExportColumn,
  OrganizationReportResponse,
  ReportDateRange,
  ReportFilters,
  UserActivityReportResponse,
} from '@features/reports/models/report.models';
import type {
  OverdueTasksReportResponse,
  ProductivityReportResponse,
  ProjectReportResponse,
  TaskCompletionReportResponse,
  TaskReportResponse,
  WorkloadReportResponse,
} from '@features/dashboard/models/dashboard.models';
import type { DistributionChart, PagedResult } from '@features/reports/models/report.models';
import type { ActivityHistoryItem, AuditLogItem } from '@features/reports/models/report.models';
import { presetToDateRange } from '@features/reports/models/report.utils';

type ReportData =
  | TaskReportResponse
  | ProjectReportResponse
  | OrganizationReportResponse
  | UserActivityReportResponse
  | WorkloadReportResponse
  | ProductivityReportResponse
  | TaskCompletionReportResponse
  | OverdueTasksReportResponse
  | DistributionChart
  | PagedResult<ActivityHistoryItem>
  | PagedResult<AuditLogItem>
  | null;

@Injectable({ providedIn: 'root' })
export class ReportStore {
  private readonly api = inject(ReportApiService);
  private readonly analyticsService = inject(AnalyticsService);

  private readonly _reportType = signal<ReportType>(ReportType.Tasks);
  private readonly _data = signal<ReportData>(null);
  private readonly _filters = signal<ReportFilters>({ page: 1, pageSize: 20, sortDescending: true });
  private readonly _dateRange = signal<ReportDateRange>(presetToDateRange(DateRangePreset.All));
  private readonly _selectedOrganizationId = signal<string | null>(null);
  private readonly _selectedProjectId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reportType = this._reportType.asReadonly();
  readonly data = this._data.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly dateRange = this._dateRange.asReadonly();
  readonly selectedOrganizationId = this._selectedOrganizationId.asReadonly();
  readonly selectedProjectId = this._selectedProjectId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly exportStatus = this.analyticsService.exportStatus;
  readonly exportProgress = this.analyticsService.exportProgress;

  loadReport(type: ReportType): void {
    this._reportType.set(type);
    this._loading.set(true);
    this._error.set(null);

    const query = this.buildQuery();
    const request$ = this.resolveRequest(type, query) as Observable<ReportData>;

    request$
      .pipe(
        tap((result) => this._data.set(result)),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load report'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  setFilters(partial: Partial<ReportFilters>): void {
    this._filters.update((current) => ({ ...current, ...partial, page: partial.page ?? 1 }));
    this.loadReport(this._reportType());
  }

  setPage(page: number): void {
    this.setFilters({ page });
  }

  setDateRangePreset(preset: DateRangePreset): void {
    this._dateRange.set(presetToDateRange(preset));
    this.loadReport(this._reportType());
  }

  setOrganizationId(organizationId: string | null): void {
    this._selectedOrganizationId.set(organizationId);
    this.loadReport(this._reportType());
  }

  setProjectId(projectId: string | null): void {
    this._selectedProjectId.set(projectId);
    this.loadReport(this._reportType());
  }

  refresh(): void {
    this.loadReport(this._reportType());
  }

  exportCurrent<T extends Record<string, unknown>>(
    format: ExportFormat,
    filename: string,
    rows: T[],
    columns: ExportColumn<T>[],
  ): void {
    this.analyticsService.exportTable(format, filename, rows, columns);
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

  private resolveRequest(type: ReportType, query: ReportFilters) {
    switch (type) {
      case ReportType.Tasks:
        return this.api.getTaskReport(query);
      case ReportType.Projects:
        return this.api.getProjectReport(query);
      case ReportType.Organizations:
        return this.api.getOrganizationReport(query);
      case ReportType.Users:
        return this.api.getUserReport(query);
      case ReportType.Workload:
        return this.api.getWorkloadReport(query);
      case ReportType.Productivity:
        return this.api.getProductivityReport(query);
      case ReportType.Completion:
        return this.api.getCompletionReport(query);
      case ReportType.Overdue:
        return this.api.getOverdueReport({ ...query, sortBy: query.sortBy ?? 'dueDate' });
      case ReportType.Priority:
        return this.api.getPriorityDistribution(query);
      case ReportType.Status:
        return this.api.getStatusDistribution(query);
      case ReportType.Activity:
        return this.api.getActivityReport(query);
      case ReportType.Audit:
        return this.api.getAuditReport(query);
      default:
        return this.api.getTaskReport(query);
    }
  }
}
