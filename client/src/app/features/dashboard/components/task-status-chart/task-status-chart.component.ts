import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-task-status-chart',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Task Status Distribution"
      subtitle="Current workload by status"
      icon="donut_large"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No task data"
      emptyDescription="Task status distribution will appear once tasks are created."
    >
      <app-chart-canvas
        kind="doughnut"
        ariaLabel="Task status distribution chart"
        [labels]="labels()"
        [values]="values()"
      />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskStatusChartComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(() => this.store.statusChart()?.items.map((item) => item.label) ?? []);
  readonly values = computed(() => this.store.statusChart()?.items.map((item) => item.value) ?? []);
  readonly isEmpty = computed(() => this.labels().length === 0);
}
