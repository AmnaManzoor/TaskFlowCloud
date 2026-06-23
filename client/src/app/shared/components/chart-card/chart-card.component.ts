import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartCanvasComponent, ChartKind } from '@shared/components/chart-canvas/chart-canvas.component';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';

@Component({
  selector: 'app-chart-card',
  imports: [DashboardWidgetComponent, ChartCanvasComponent],
  template: `
    <app-dashboard-widget
      [title]="title()"
      [subtitle]="subtitle()"
      [icon]="icon()"
      [loading]="loading()"
      [empty]="empty()"
      [emptyTitle]="emptyTitle()"
      [emptyDescription]="emptyDescription()"
    >
      <app-chart-canvas
        [kind]="kind()"
        [labels]="labels()"
        [values]="values()"
        [ariaLabel]="title()"
      />
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly icon = input<string | undefined>(undefined);
  readonly kind = input<ChartKind>('bar');
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyTitle = input<string | undefined>(undefined);
  readonly emptyDescription = input<string | undefined>(undefined);
}
