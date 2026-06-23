import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import type { StatCardViewModel, TrendDirection } from '@features/dashboard/models/dashboard.models';

@Component({
  selector: 'app-stat-card',
  imports: [MatIconModule, SkeletonLoaderComponent, DecimalPipe],
  template: `
    @if (loading()) {
      <div class="stat-card stat-card--skeleton" aria-busy="true">
        <app-skeleton-loader [rows]="3" />
      </div>
    } @else {
      <article class="stat-card u-animate-fade-in" [attr.aria-label]="card().label">
        <div class="stat-card__icon-wrap" aria-hidden="true">
          <mat-icon>{{ card().icon }}</mat-icon>
        </div>
        <div class="stat-card__content">
          <p class="stat-card__label">{{ card().label }}</p>
          <p class="stat-card__value">{{ card().value | number }}</p>
          <p class="stat-card__description">{{ card().description }}</p>
          @if (card().trendLabel) {
            <p class="stat-card__trend" [class]="trendClass(card().trendDirection)">
              <mat-icon aria-hidden="true">{{ trendIcon(card().trendDirection) }}</mat-icon>
              {{ card().trendLabel }}
            </p>
          }
        </div>
      </article>
    }
  `,
  styles: `
    .stat-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
    }

    .stat-card--skeleton {
      min-height: 7rem;
    }

    .stat-card__icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.875rem;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
    }

    .stat-card__content {
      min-width: 0;
    }

    .stat-card__label {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }

    .stat-card__value {
      margin: 0.125rem 0 0;
      font: var(--mat-sys-headline-small);
      letter-spacing: -0.02em;
    }

    .stat-card__description {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .stat-card__trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin: 0.5rem 0 0;
      font: var(--mat-sys-label-medium);
    }

    .stat-card__trend mat-icon {
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }

    .stat-card__trend--up {
      color: #059669;
    }

    .stat-card__trend--down {
      color: #dc2626;
    }

    .stat-card__trend--neutral {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly card = input.required<StatCardViewModel>();
  readonly loading = input(false);

  trendIcon(direction?: TrendDirection): string {
    switch (direction) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'remove';
    }
  }

  trendClass(direction?: TrendDirection): string {
    return `stat-card__trend stat-card__trend--${direction ?? 'neutral'}`;
  }
}
