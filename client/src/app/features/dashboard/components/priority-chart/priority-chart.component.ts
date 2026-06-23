import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-priority-chart',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Tasks by Priority"
      subtitle="Priority breakdown across tasks"
      icon="flag"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No priority data"
    >
      <app-chart-canvas kind="doughnut" ariaLabel="Tasks by priority chart" [labels]="labels()" [values]="values()" />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityChartComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(() => this.store.priorityChart()?.items.map((item) => item.label) ?? []);
  readonly values = computed(() => this.store.priorityChart()?.items.map((item) => item.value) ?? []);
  readonly isEmpty = computed(() => this.labels().length === 0);
}
