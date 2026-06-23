import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-priority-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Priority Distribution" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityReportPageComponent {
  readonly type = ReportType.Priority;
}
