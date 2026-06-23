import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-productivity-chart',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Weekly Productivity"
      subtitle="Tasks completed over time"
      icon="show_chart"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No productivity data"
    >
      <app-chart-canvas
        kind="line"
        ariaLabel="Weekly productivity chart"
        [labels]="labels()"
        [values]="values()"
      />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductivityChartComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(
    () => this.store.productivityReport()?.productivityTrend.dataPoints.map((point) => point.label) ?? [],
  );
  readonly values = computed(
    () => this.store.productivityReport()?.productivityTrend.dataPoints.map((point) => point.value) ?? [],
  );
  readonly isEmpty = computed(() => this.labels().length === 0);
}
