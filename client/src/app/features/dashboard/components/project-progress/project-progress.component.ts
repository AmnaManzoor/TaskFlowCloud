import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartCanvasComponent } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-project-progress',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      title="Project Progress"
      subtitle="Completion across active projects"
      icon="insights"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      emptyTitle="No project progress"
      emptyDescription="Create projects to track progress over time."
    >
      <app-chart-canvas
        kind="bar"
        ariaLabel="Project progress chart"
        [labels]="labels()"
        [values]="values()"
      />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProgressComponent {
  readonly store = inject(DashboardStore);

  readonly labels = computed(() =>
    this.store.projectReportItems().map((project) => project.name),
  );
  readonly values = computed(() =>
    this.store.projectReportItems().map((project) => project.completedTaskCount),
  );
  readonly isEmpty = computed(() => this.store.projectReportItems().length === 0);
}
