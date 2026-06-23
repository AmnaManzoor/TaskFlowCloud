import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import type { KpiCardViewModel } from '@features/reports/models/report.models';

@Component({
  selector: 'app-kpi-card',
  imports: [MatIconModule, SkeletonLoaderComponent],
  template: `
    @if (loading()) {
      <div class="kpi-card kpi-card--skeleton"><app-skeleton-loader [rows]="3" /></div>
    } @else {
      <article class="kpi-card" [attr.aria-label]="card().label">
        <mat-icon class="kpi-card__icon" aria-hidden="true">{{ card().icon }}</mat-icon>
        <div>
          <p class="kpi-card__label">{{ card().label }}</p>
          <p class="kpi-card__value">{{ card().value }}</p>
          <p class="kpi-card__description">{{ card().description }}</p>
          @if (card().trendLabel) {
            <p class="kpi-card__trend">{{ card().trendLabel }}</p>
          }
        </div>
      </article>
    }
  `,
  styles: `
    .kpi-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.875rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: transform 160ms ease;
    }
    .kpi-card:hover { transform: translateY(-2px); }
    .kpi-card__icon { color: var(--mat-sys-primary); }
    .kpi-card__label { margin: 0; font: var(--mat-sys-label-large); color: var(--mat-sys-on-surface-variant); }
    .kpi-card__value { margin: 0.125rem 0 0; font: var(--mat-sys-headline-small); }
    .kpi-card__description { margin: 0.25rem 0 0; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
    .kpi-card__trend { margin: 0.375rem 0 0; font: var(--mat-sys-label-medium); color: var(--mat-sys-primary); }
    .kpi-card--skeleton { min-height: 6rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  readonly card = input.required<KpiCardViewModel>();
  readonly loading = input(false);
}
