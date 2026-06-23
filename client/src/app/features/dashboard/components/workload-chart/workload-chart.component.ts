import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-workload-chart',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Workload Distribution"
      subtitle="Assigned tasks by team member"
      icon="groups"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No workload data"
      emptyDescription="Assign tasks to see workload distribution."
    >
      <app-chart-canvas
        kind="bar"
        ariaLabel="Workload distribution chart"
        [labels]="labels()"
        [values]="values()"
      />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadChartComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(
    () => this.store.workloadReport()?.workloadChart.items.map((item) => item.label) ?? [],
  );
  readonly values = computed(
    () => this.store.workloadReport()?.workloadChart.items.map((item) => item.value) ?? [],
  );
  readonly isEmpty = computed(() => this.labels().length === 0);
}
