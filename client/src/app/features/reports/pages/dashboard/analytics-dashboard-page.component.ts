import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReportChartCardComponent } from '@features/reports/components/chart-card/chart-card.component';
import { DateRangePickerComponent } from '@features/reports/components/date-range-picker/date-range-picker.component';
import { FilterPanelComponent } from '@features/reports/components/filter-panel/filter-panel.component';
import { KpiCardComponent } from '@features/reports/components/kpi-card/kpi-card.component';
import { ProgressWidgetComponent } from '@features/reports/components/progress-widget/progress-widget.component';
import { ReportCardComponent } from '@features/reports/components/report-card/report-card.component';
import { SummaryWidgetComponent } from '@features/reports/components/summary-widget/summary-widget.component';
import { REPORT_NAV_ITEMS } from '@features/reports/models/report-nav';
import { AnalyticsStore } from '@features/reports/stores/analytics.store';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';

@Component({
  selector: 'app-analytics-dashboard-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    KpiCardComponent,
    ReportChartCardComponent,
    DateRangePickerComponent,
    FilterPanelComponent,
    SummaryWidgetComponent,
    ProgressWidgetComponent,
    ReportCardComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="analytics-dashboard">
      <header class="analytics-dashboard__header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Enterprise reporting overview powered by backend analytics APIs.</p>
        </div>
        <div class="analytics-dashboard__actions">
          <app-date-range-picker />
          <button mat-stroked-button type="button" (click)="store.refresh()" [disabled]="store.loading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </header>

      <app-filter-panel />

      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="store.refresh()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="10" />
      } @else {
        <section class="analytics-dashboard__kpis" aria-label="Key performance indicators">
          @for (card of store.kpiCards(); track card.id) {
            <app-kpi-card [card]="card" />
          }
        </section>

        <section class="analytics-dashboard__charts">
          <app-report-chart-card
            title="Status Distribution"
            kind="doughnut"
            icon="donut_large"
            [labels]="store.statusSeries().labels"
            [values]="store.statusSeries().values"
          />
          <app-report-chart-card
            title="Priority Distribution"
            kind="pie"
            icon="flag"
            [labels]="store.prioritySeries().labels"
            [values]="store.prioritySeries().values"
          />
          <app-report-chart-card
            title="Completion Trend"
            kind="area"
            icon="show_chart"
            [labels]="store.completionSeries().labels"
            [values]="store.completionSeries().values"
          />
          <app-report-chart-card
            title="Team Workload"
            kind="bar"
            icon="stacked_bar_chart"
            [labels]="store.workloadSeries().labels"
            [values]="store.workloadSeries().values"
          />
        </section>

        <section class="analytics-dashboard__widgets">
          <app-summary-widget title="Recent Tasks" subtitle="Latest task report items">
            <ul>
              @for (task of store.recentTasks(); track task.id) {
                <li>{{ task.title }} — {{ task.projectName }}</li>
              }
            </ul>
          </app-summary-widget>
          <app-summary-widget title="Recent Projects" subtitle="Latest project report items">
            <ul>
              @for (project of store.recentProjects(); track project.id) {
                <li>{{ project.name }} ({{ project.taskCount }} tasks)</li>
              }
            </ul>
          </app-summary-widget>
          <app-summary-widget title="Recent Activity" subtitle="Workspace events">
            <ul>
              @for (item of store.recentActivity(); track item.id) {
                <li>{{ item.description }}</li>
              }
            </ul>
          </app-summary-widget>
          <app-summary-widget title="Audit Summary" subtitle="Recent audit events">
            <ul>
              @for (item of store.recentAudit(); track item.id) {
                <li>{{ item.action }} — {{ item.entityType }}</li>
              }
            </ul>
          </app-summary-widget>
          @if (store.personal(); as personal) {
            <app-progress-widget
              label="Weekly task completion"
              [value]="completionPercent(personal.completedTasks, personal.assignedTasks)"
            />
          }
        </section>

        <section class="analytics-dashboard__reports">
          <h2>Individual Reports</h2>
          <div class="analytics-dashboard__report-grid">
            @for (item of reportLinks; track item.route) {
              <app-report-card [title]="item.label" [description]="item.description" [icon]="item.icon" [route]="item.route" />
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .analytics-dashboard { display: flex; flex-direction: column; gap: 1rem; }
    .analytics-dashboard__header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; }
    .analytics-dashboard__header h1 { margin: 0; font: var(--mat-sys-headline-medium); }
    .analytics-dashboard__header p { margin: 0.25rem 0 0; color: var(--mat-sys-on-surface-variant); }
    .analytics-dashboard__actions { display: flex; gap: 0.5rem; align-items: center; }
    .analytics-dashboard__kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.75rem; }
    .analytics-dashboard__charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
    .analytics-dashboard__widgets { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
    .analytics-dashboard__widgets ul { margin: 0; padding-left: 1rem; }
    .analytics-dashboard__report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 0.75rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardPageComponent implements OnInit {
  readonly store = inject(AnalyticsStore);
  readonly reportLinks = REPORT_NAV_ITEMS.filter((item) => item.route !== '/reports/dashboard');

  ngOnInit(): void {
    this.store.load();
  }

  completionPercent(completed: number, assigned: number): number {
    if (assigned <= 0) return 0;
    return Math.round((completed / assigned) * 100);
  }
}
