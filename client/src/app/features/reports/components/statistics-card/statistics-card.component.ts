import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KpiCardComponent } from '@features/reports/components/kpi-card/kpi-card.component';
import type { KpiCardViewModel } from '@features/reports/models/report.models';

@Component({
  selector: 'app-statistics-card',
  imports: [KpiCardComponent],
  template: `<app-kpi-card [card]="card()" [loading]="loading()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsCardComponent {
  readonly card = input.required<KpiCardViewModel>();
  readonly loading = input(false);
}
