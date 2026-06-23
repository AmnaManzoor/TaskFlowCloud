import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-completion-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Completion Trends" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionReportPageComponent {
  readonly type = ReportType.Completion;
}
