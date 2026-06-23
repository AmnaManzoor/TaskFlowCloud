import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-task-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Task Reports" subtitle="Task status, priority, and assignment analytics" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskReportPageComponent {
  readonly type = ReportType.Tasks;
}
