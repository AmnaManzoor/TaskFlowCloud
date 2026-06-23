import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { finalize, tap } from 'rxjs';
import { ReportApiService } from '@features/reports/services/report-api.service';
import { ExportFormat, ExportStatus } from '@features/reports/models/report.enums';
import type { AnalyticsBundle, ExportColumn } from '@features/reports/models/report.models';
import type { ReportFilterQuery } from '@features/dashboard/models/dashboard.models';
import { NotificationService as ToastService } from '@core/services/notification.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ReportApiService);
  private readonly toast = inject(ToastService);

  private readonly _exportStatus = signal<ExportStatus>(ExportStatus.Idle);
  private readonly _exportProgress = signal(0);

  readonly exportStatus = this._exportStatus.asReadonly();
  readonly exportProgress = this._exportProgress.asReadonly();

  loadAnalyticsDashboard(filters: ReportFilterQuery = {}): Observable<AnalyticsBundle> {
    return forkJoin({
      personal: this.api.getPersonalDashboard(),
      statistics: this.api.getStatistics(filters),
      notificationCount: this.api.getNotificationCount(),
      statusChart: this.api.getStatusDistribution(filters),
      priorityChart: this.api.getPriorityDistribution(filters),
      productivity: this.api.getProductivityReport(filters),
      workload: this.api.getWorkloadReport({ ...filters, pageSize: 10 }),
      completion: this.api.getCompletionReport(filters),
      taskReport: this.api.getTaskReport({
        ...filters,
        pageSize: 8,
        sortBy: 'createdAt',
        sortDescending: true,
      }),
      projectReport: this.api.getProjectReport({
        ...filters,
        pageSize: 8,
        sortBy: 'createdAt',
        sortDescending: true,
      }),
      activity: this.api.getActivityReport({ ...filters, pageSize: 8, sortDescending: true }),
      audit: this.api.getAuditReport({ ...filters, pageSize: 8, sortDescending: true }),
    }).pipe(
      map((bundle) => ({
        personal: bundle.personal,
        statistics: bundle.statistics,
        unreadCount: bundle.notificationCount.unreadCount,
        statusChart: bundle.statusChart,
        priorityChart: bundle.priorityChart,
        productivity: bundle.productivity,
        workload: bundle.workload,
        completion: bundle.completion,
        taskReport: bundle.taskReport,
        projectReport: bundle.projectReport,
        activity: bundle.activity,
        audit: bundle.audit,
      })),
    );
  }

  exportTable<T extends Record<string, unknown>>(
    format: ExportFormat,
    filename: string,
    rows: T[],
    columns: ExportColumn<T>[],
  ): void {
    if (rows.length === 0) {
      this.toast.error('No data to export');
      return;
    }

    this._exportStatus.set(ExportStatus.Preparing);
    this._exportProgress.set(10);

    window.setTimeout(() => {
      try {
        this._exportStatus.set(ExportStatus.Downloading);
        this._exportProgress.set(60);

        if (format === ExportFormat.Pdf) {
          this.exportPdf(filename, rows, columns);
        } else {
          const csv = this.toDelimited(rows, columns, format === ExportFormat.Excel ? '\t' : ',');
          const mime =
            format === ExportFormat.Excel
              ? 'application/vnd.ms-excel;charset=utf-8;'
              : 'text/csv;charset=utf-8;';
          const extension = format === ExportFormat.Excel ? 'xls' : 'csv';
          this.downloadBlob(new Blob([csv], { type: mime }), `${filename}.${extension}`);
        }

        this._exportProgress.set(100);
        this._exportStatus.set(ExportStatus.Complete);
        this.toast.success('Export downloaded');
      } catch {
        this._exportStatus.set(ExportStatus.Error);
        this.toast.error('Export failed');
      } finally {
        window.setTimeout(() => {
          this._exportStatus.set(ExportStatus.Idle);
          this._exportProgress.set(0);
        }, 1200);
      }
    }, 250);
  }

  private toDelimited<T extends Record<string, unknown>>(
    rows: T[],
    columns: ExportColumn<T>[],
    delimiter: string,
  ): string {
    const header = columns.map((column) => this.escape(column.header, delimiter)).join(delimiter);
    const body = rows
      .map((row) =>
        columns
          .map((column) => {
            const raw = column.format ? column.format(row) : row[column.key as keyof T];
            return this.escape(String(raw ?? ''), delimiter);
          })
          .join(delimiter),
      )
      .join('\n');
    return `${header}\n${body}`;
  }

  private escape(value: string, delimiter: string): string {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private exportPdf<T extends Record<string, unknown>>(
    filename: string,
    rows: T[],
    columns: ExportColumn<T>[],
  ): void {
    const html = `
      <html><head><title>${filename}</title>
      <style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head>
      <body><h1>${filename}</h1><table><thead><tr>
      ${columns.map((c) => `<th>${c.header}</th>`).join('')}
      </tr></thead><tbody>
      ${rows
        .map(
          (row) =>
            `<tr>${columns
              .map((column) => {
                const raw = column.format ? column.format(row) : row[column.key as keyof T];
                return `<td>${String(raw ?? '')}</td>`;
              })
              .join('')}</tr>`,
        )
        .join('')}
      </tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.html`);
    this.toast.success('PDF-ready HTML export downloaded');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
