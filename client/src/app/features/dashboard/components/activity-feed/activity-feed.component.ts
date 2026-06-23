import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { activityIcon, formatRelativeTime } from '@features/dashboard/models/dashboard.utils';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-activity-feed',
  imports: [DashboardWidgetComponent, UserAvatarComponent, MatIconModule],
  template: `
    <app-dashboard-widget
      title="Activity Timeline"
      subtitle="Recent updates across your workspace"
      icon="history"
      [loading]="store.loading()"
      [empty]="store.activity().length === 0"
      emptyTitle="No recent activity"
      emptyDescription="Activity from tasks, projects, and comments will show here."
      [collapsible]="isMobile()"
      [collapsed]="collapsed()"
      (toggleCollapse)="collapsed.set(!collapsed())"
    >
      <ol class="timeline" aria-label="Activity timeline">
        @for (item of store.activity(); track item.id) {
          <li class="timeline__item u-animate-fade-in">
            <div class="timeline__icon" aria-hidden="true">
              <mat-icon class="timeline__mat-icon">{{ activityIcon(item.activityType) }}</mat-icon>
            </div>
            <div class="timeline__content">
              <div class="timeline__header">
                <app-user-avatar [name]="item.userId" [size]="28" />
                <p class="timeline__description">{{ item.description }}</p>
              </div>
              <p class="timeline__meta">
                <span>{{ item.entityType }}</span>
                <time [dateTime]="item.createdAt">{{ formatRelativeTime(item.createdAt) }}</time>
              </p>
            </div>
          </li>
        }
      </ol>
    </app-dashboard-widget>
  `,
  styles: `
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline__item {
      display: flex;
      gap: 0.875rem;
    }

    .timeline__icon {
      flex-shrink: 0;
    }

    .timeline__mat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-size: 1.125rem;
    }

    .timeline__content {
      flex: 1;
      min-width: 0;
    }

    .timeline__header {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
    }

    .timeline__description {
      margin: 0;
      font: var(--mat-sys-body-medium);
    }

    .timeline__meta {
      display: flex;
      gap: 0.75rem;
      margin: 0.375rem 0 0 2.375rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  readonly store = inject(DashboardStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly collapsed = signal(false);
  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 959px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly activityIcon = activityIcon;
  readonly formatRelativeTime = formatRelativeTime;
}
