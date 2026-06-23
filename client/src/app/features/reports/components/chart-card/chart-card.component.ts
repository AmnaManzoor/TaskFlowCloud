import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartCardComponent } from '@shared/components/chart-card/chart-card.component';
import { ChartKind } from '@shared/components/chart-canvas/chart-canvas.component';

@Component({
  selector: 'app-report-chart-card',
  imports: [ChartCardComponent],
  template: `
    <app-chart-card
      [title]="title()"
      [subtitle]="subtitle()"
      [icon]="icon()"
      [kind]="kind()"
      [labels]="labels()"
      [values]="values()"
      [loading]="loading()"
      [empty]="empty()"
      [emptyTitle]="emptyTitle()"
      [emptyDescription]="emptyDescription()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportChartCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
  readonly kind = input<ChartKind>('bar');
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyTitle = input<string>();
  readonly emptyDescription = input<string>();
}
