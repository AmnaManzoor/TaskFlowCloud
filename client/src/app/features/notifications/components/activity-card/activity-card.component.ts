import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import type { ActivityHistoryItem } from '@features/notifications/models/activity.models';
import {
  formatRelativeTime,
  getActivityIcon,
  getActivityRoute,
} from '@features/notifications/models/notification.utils';

@Component({
  selector: 'app-activity-card',
  imports: [MatButtonModule, MatChipsModule, MatIconModule, RouterLink],
  template: `
    <article class="activity-card" role="article" [attr.aria-label]="item().description">
      <div class="activity-card__avatar" aria-hidden="true">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>

      <div class="activity-card__body">
        <p class="activity-card__description">{{ item().description }}</p>
        <div class="activity-card__meta">
          <mat-chip-set aria-label="Activity metadata">
            <mat-chip>{{ item().activityType }}</mat-chip>
            <mat-chip>{{ item().entityType }}</mat-chip>
          </mat-chip-set>
          <time class="activity-card__time" [dateTime]="item().createdAt">
            {{ formatRelativeTime(item().createdAt) }}
          </time>
        </div>
      </div>

      @if (entityRoute(); as route) {
        <a mat-stroked-button [routerLink]="route">Open</a>
      }
    </article>
  `,
  styles: `
    .activity-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.875rem;
      align-items: center;
      padding: 0.875rem;
      border-radius: 0.875rem;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      transition: background 160ms ease, transform 160ms ease;
    }

    .activity-card:hover {
      background: var(--mat-sys-surface-container);
      transform: translateY(-1px);
    }

    .activity-card__avatar {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .activity-card__description {
      margin: 0;
      font: var(--mat-sys-body-large);
    }

    .activity-card__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .activity-card__time {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    @media (max-width: 720px) {
      .activity-card {
        grid-template-columns: auto 1fr;
      }

      a[mat-stroked-button] {
        grid-column: 1 / -1;
        justify-self: start;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCardComponent {
  readonly item = input.required<ActivityHistoryItem>();

  readonly formatRelativeTime = formatRelativeTime;

  protected icon(): string {
    const activity = this.item();
    return getActivityIcon(activity.entityType, activity.activityType);
  }

  protected entityRoute(): string | null {
    return getActivityRoute(this.item());
  }
}
