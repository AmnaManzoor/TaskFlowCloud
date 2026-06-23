import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-activity-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Activity Report" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityReportPageComponent {
  readonly type = ReportType.Activity;
}
