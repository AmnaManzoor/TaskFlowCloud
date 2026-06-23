import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ExportFormat, ReportType } from '@features/reports/models/report.enums';
import { ReportChartCardComponent } from '@features/reports/components/chart-card/chart-card.component';
import { DateRangePickerComponent } from '@features/reports/components/date-range-picker/date-range-picker.component';
import { EmptyReportComponent } from '@features/reports/components/empty-report/empty-report.component';
import { ExportMenuComponent } from '@features/reports/components/export-menu/export-menu.component';
import { FilterPanelComponent } from '@features/reports/components/filter-panel/filter-panel.component';
import { ReportTableComponent, type ReportTableColumn } from '@features/reports/components/report-table/report-table.component';
import { SummaryWidgetComponent } from '@features/reports/components/summary-widget/summary-widget.component';
import { chartToSeries } from '@features/reports/models/report.utils';
import { ReportStore } from '@features/reports/stores/report.store';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import type {
  OrganizationReportItem,
  OrganizationReportResponse,
  TaskReportItem,
  TaskReportResponse,
  UserActivityReportItem,
  UserActivityReportResponse,
} from '@features/reports/models/report.models';
import type {
  OverdueTaskReportItem,
  OverdueTasksReportResponse,
  ProductivityReportItem,
  ProductivityReportResponse,
  ProjectReportItem,
  ProjectReportResponse,
  TaskCompletionReportItem,
  TaskCompletionReportResponse,
  WorkloadReportItem,
  WorkloadReportResponse,
} from '@features/dashboard/models/dashboard.models';
import type { DistributionChart } from '@features/dashboard/models/dashboard.models';
import { taskPriorityLabel, taskStatusLabel } from '@features/dashboard/models/dashboard.utils';

@Component({
  selector: 'app-report-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    ReportChartCardComponent,
    DateRangePickerComponent,
    EmptyReportComponent,
    ExportMenuComponent,
    FilterPanelComponent,
    ReportTableComponent,
    SummaryWidgetComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="report-detail">
      <header class="report-detail__header">
        <div>
          <h1>{{ title() }}</h1>
          <p>{{ subtitle() }}</p>
        </div>
        <div class="report-detail__actions">
          <app-date-range-picker />
          <button mat-icon-button type="button" aria-label="Refresh report" (click)="store.refresh()">
            <mat-icon>refresh</mat-icon>
          </button>
          <app-export-menu [disabled]="!canExport()" (export)="onExport($event)" />
        </div>
      </header>

      <app-filter-panel />

      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="store.refresh()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="8" />
      } @else if (!hasData()) {
        <app-empty-report />
      } @else {
        @if (summaryTotal() !== null) {
          <app-summary-widget title="Summary" [subtitle]="'Total records: ' + summaryTotal()">
            <p>Server-calculated aggregates for the selected filters.</p>
          </app-summary-widget>
        }

        @if (chartSeries().labels.length > 0) {
          <app-report-chart-card
            [title]="chartTitle()"
            [kind]="chartKind()"
            [labels]="chartSeries().labels"
            [values]="chartSeries().values"
          />
        }

        <app-report-table [rows]="tableRows()" [columns]="tableColumns()" [caption]="title()" />

        @if (showPaginator()) {
          <mat-paginator
            [length]="totalCount()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPage($event)"
            aria-label="Report pagination"
          />
        }
      }
    </div>
  `,
  styles: `
    .report-detail { display: flex; flex-direction: column; gap: 1rem; }
    .report-detail__header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; }
    .report-detail__header h1 { margin: 0; font: var(--mat-sys-headline-medium); }
    .report-detail__header p { margin: 0.25rem 0 0; color: var(--mat-sys-on-surface-variant); }
    .report-detail__actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetailComponent implements OnInit {
  readonly store = inject(ReportStore);

  readonly reportType = input.required<ReportType>();
  readonly title = input.required<string>();
  readonly subtitle = input('Backend-calculated report data');

  readonly chartSeries = computed(() => {
    const data = this.store.data();
    if (!data) return { labels: [], values: [] };
    if (this.isDistributionChart(data)) return chartToSeries(data);
    if ('statusChart' in data && data.statusChart) return chartToSeries(data.statusChart);
    if ('priorityChart' in data && data.priorityChart) return chartToSeries(data.priorityChart);
    if ('workloadChart' in data && data.workloadChart) return chartToSeries(data.workloadChart);
    if ('productivityTrend' in data && data.productivityTrend) return chartToSeries(data.productivityTrend);
    if ('completionTrend' in data && data.completionTrend) return chartToSeries(data.completionTrend);
    return { labels: [], values: [] };
  });

  ngOnInit(): void {
    this.store.loadReport(this.reportType());
  }

  hasData(): boolean {
    const data = this.store.data();
    if (!data) return false;
    if (this.isDistributionChart(data)) return data.items.length > 0;
    if ('items' in data) return (data.items as unknown[]).length > 0;
    return true;
  }

  private isDistributionChart(data: NonNullable<ReturnType<typeof this.store.data>>): data is DistributionChart {
    return 'chartType' in data && 'items' in data && !('summary' in data) && !('totalCount' in data);
  }

  summaryTotal(): number | null {
    const data = this.store.data();
    if (data && 'summary' in data) return data.summary.totalCount;
    if (data && 'totalCount' in data) return data.totalCount as number;
    return null;
  }

  chartTitle(): string {
    switch (this.reportType()) {
      case ReportType.Priority:
        return 'Priority Distribution';
      case ReportType.Status:
        return 'Status Distribution';
      case ReportType.Workload:
        return 'Workload Distribution';
      case ReportType.Productivity:
        return 'Productivity Trend';
      case ReportType.Completion:
        return 'Completion Trend';
      default:
        return 'Report Chart';
    }
  }

  chartKind(): 'bar' | 'line' | 'doughnut' | 'pie' | 'area' {
    const type = this.reportType();
    if (type === ReportType.Priority || type === ReportType.Status) return 'doughnut';
    if (type === ReportType.Productivity || type === ReportType.Completion) return 'area';
    return 'bar';
  }

  tableRows(): object[] {
    const data = this.store.data();
    if (!data) return [];
    if (this.isDistributionChart(data)) {
      return data.items.map((item) => ({ label: item.label, value: item.value }));
    }
    if ('items' in data) return data.items as object[];
    return [];
  }

  tableColumns(): ReportTableColumn<object>[] {
    switch (this.reportType()) {
      case ReportType.Tasks:
        return [
          { key: 'title', header: 'Title', cell: (r) => (r as TaskReportItem).title },
          { key: 'project', header: 'Project', cell: (r) => (r as TaskReportItem).projectName },
          { key: 'status', header: 'Status', cell: (r) => taskStatusLabel((r as TaskReportItem).status) },
          { key: 'priority', header: 'Priority', cell: (r) => taskPriorityLabel((r as TaskReportItem).priority) },
        ];
      case ReportType.Projects:
        return [
          { key: 'name', header: 'Project', cell: (r) => (r as ProjectReportItem).name },
          { key: 'status', header: 'Status', cell: (r) => String((r as ProjectReportItem).status) },
          { key: 'tasks', header: 'Tasks', cell: (r) => (r as ProjectReportItem).taskCount },
          { key: 'completed', header: 'Completed', cell: (r) => (r as ProjectReportItem).completedTaskCount },
        ];
      case ReportType.Organizations:
        return [
          { key: 'name', header: 'Organization', cell: (r) => (r as OrganizationReportItem).name },
          { key: 'projects', header: 'Projects', cell: (r) => (r as OrganizationReportItem).projectCount },
          { key: 'members', header: 'Members', cell: (r) => (r as OrganizationReportItem).memberCount },
          { key: 'openTasks', header: 'Open Tasks', cell: (r) => (r as OrganizationReportItem).openTaskCount },
        ];
      case ReportType.Users:
        return [
          { key: 'name', header: 'User', cell: (r) => (r as UserActivityReportItem).displayName },
          { key: 'assigned', header: 'Assigned', cell: (r) => (r as UserActivityReportItem).tasksAssigned },
          { key: 'completed', header: 'Completed', cell: (r) => (r as UserActivityReportItem).tasksCompleted },
          { key: 'activity', header: 'Activity', cell: (r) => (r as UserActivityReportItem).activityCount },
        ];
      case ReportType.Workload:
        return [
          { key: 'name', header: 'User', cell: (r) => (r as WorkloadReportItem).displayName },
          { key: 'assigned', header: 'Assigned', cell: (r) => (r as WorkloadReportItem).assignedTasks },
          { key: 'overdue', header: 'Overdue', cell: (r) => (r as WorkloadReportItem).overdueTasks },
          { key: 'score', header: 'Score', cell: (r) => (r as WorkloadReportItem).workloadScore },
        ];
      case ReportType.Productivity:
        return [
          { key: 'period', header: 'Period', cell: (r) => (r as ProductivityReportItem).period },
          { key: 'completed', header: 'Completed', cell: (r) => (r as ProductivityReportItem).tasksCompleted },
          { key: 'created', header: 'Created', cell: (r) => (r as ProductivityReportItem).tasksCreated },
          { key: 'rate', header: 'Rate %', cell: (r) => (r as ProductivityReportItem).completionRate },
        ];
      case ReportType.Completion:
        return [
          { key: 'date', header: 'Date', cell: (r) => (r as TaskCompletionReportItem).date },
          { key: 'completed', header: 'Completed', cell: (r) => (r as TaskCompletionReportItem).completedCount },
          { key: 'created', header: 'Created', cell: (r) => (r as TaskCompletionReportItem).createdCount },
        ];
      case ReportType.Overdue:
        return [
          { key: 'title', header: 'Task', cell: (r) => (r as OverdueTaskReportItem).title },
          { key: 'project', header: 'Project', cell: (r) => (r as OverdueTaskReportItem).projectName },
          { key: 'due', header: 'Due', cell: (r) => (r as OverdueTaskReportItem).dueDate },
          { key: 'days', header: 'Days Overdue', cell: (r) => (r as OverdueTaskReportItem).daysOverdue },
        ];
      case ReportType.Priority:
      case ReportType.Status:
        return [
          { key: 'label', header: 'Label', cell: (r) => (r as { label: string }).label },
          { key: 'value', header: 'Value', cell: (r) => (r as { value: number }).value },
        ];
      case ReportType.Activity:
        return [
          { key: 'type', header: 'Activity', cell: (r) => (r as { activityType: string }).activityType },
          { key: 'entity', header: 'Entity', cell: (r) => (r as { entityType: string }).entityType },
          { key: 'description', header: 'Description', cell: (r) => (r as { description: string }).description },
        ];
      case ReportType.Audit:
        return [
          { key: 'action', header: 'Action', cell: (r) => (r as { action: string }).action },
          { key: 'entity', header: 'Entity', cell: (r) => (r as { entityType: string }).entityType },
          { key: 'description', header: 'Description', cell: (r) => (r as { description: string }).description },
        ];
      default:
        return [];
    }
  }

  showPaginator(): boolean {
    return ![ReportType.Priority, ReportType.Status].includes(this.reportType());
  }

  totalCount(): number {
    const data = this.store.data();
    if (data && 'totalCount' in data) return data.totalCount as number;
    return this.tableRows().length;
  }

  pageIndex(): number {
    return (this.store.filters().page ?? 1) - 1;
  }

  pageSize(): number {
    return this.store.filters().pageSize ?? 20;
  }

  onPage(event: PageEvent): void {
    this.store.setFilters({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }

  canExport(): boolean {
    return this.tableRows().length > 0;
  }

  onExport(format: ExportFormat): void {
    const rows = this.tableRows() as Record<string, unknown>[];
    const columns = this.tableColumns().map((column) => ({
      key: column.key,
      header: column.header,
      format: (row: Record<string, unknown>) => column.cell(row),
    }));
    this.store.exportCurrent(format, this.title().toLowerCase().replace(/\s+/g, '-'), rows, columns);
  }
}
