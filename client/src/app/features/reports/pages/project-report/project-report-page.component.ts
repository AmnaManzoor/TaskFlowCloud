import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReportType } from '@features/reports/models/report.enums';
import { ReportDetailComponent } from '@features/reports/components/report-detail/report-detail.component';

@Component({
  selector: 'app-project-report-page',
  imports: [ReportDetailComponent],
  template: `<app-report-detail [reportType]="type" title="Project Reports" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectReportPageComponent {
  readonly type = ReportType.Projects;
}
