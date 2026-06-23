import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-organization-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Organization Reports" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationReportPageComponent {
  readonly type = ReportType.Organizations;
}
