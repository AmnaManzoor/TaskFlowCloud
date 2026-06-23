import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-overdue-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Overdue Tasks" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueReportPageComponent {
  readonly type = ReportType.Overdue;
}
