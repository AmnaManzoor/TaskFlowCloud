import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-activity-chart',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Monthly Activity"
      subtitle="Task creation and completion trend"
      icon="timeline"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No activity trend"
    >
      <app-chart-canvas kind="line" ariaLabel="Monthly activity chart" [labels]="labels()" [values]="values()" />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityChartComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(
    () => this.store.completionReport()?.completionTrend.dataPoints.map((point) => point.label) ?? [],
  );
  readonly values = computed(
    () => this.store.completionReport()?.completionTrend.dataPoints.map((point) => point.value) ?? [],
  );
  readonly isEmpty = computed(() => this.labels().length === 0);
}
