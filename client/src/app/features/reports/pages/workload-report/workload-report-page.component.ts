import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-workload-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Workload Analysis" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadReportPageComponent {
  readonly type = ReportType.Workload;
}
