import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-user-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="User Productivity" subtitle="User activity and contribution metrics" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserReportPageComponent {
  readonly type = ReportType.Users;
}
