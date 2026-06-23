import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-productivity-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Productivity Report" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductivityReportPageComponent {
  readonly type = ReportType.Productivity;
}
