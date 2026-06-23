import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { CollaborationService } from '@features/collaboration/services/collaboration.service';
import { activityIcon, isCollaborationActivity } from '@features/collaboration/models/collaboration.utils';
import { formatRelativeTime } from '@features/dashboard/models/dashboard.utils';
import type { ActivityHistoryItem } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-activity-panel',
  imports: [MatButtonModule, MatIconModule, SkeletonLoaderComponent, WidgetErrorComponent],
  template: `
    <section class="activity-panel" aria-label="Collaboration activity">
      @if (error()) {
        <app-widget-error [message]="error()!" (retry)="load()" />
      } @else if (loading()) {
        <app-skeleton-loader [rows]="4" />
      } @else if (items().length === 0) {
        <p class="activity-panel__empty">No collaboration activity yet.</p>
      } @else {
        <ol class="activity-panel__list">
          @for (item of items(); track item.id) {
            <li class="activity-panel__item">
              <div class="activity-panel__icon" aria-hidden="true">
                <mat-icon>{{ icon(item.activityType) }}</mat-icon>
              </div>
              <div>
                <p class="activity-panel__description">{{ item.description }}</p>
                <time class="activity-panel__time">{{ relativeTime(item.createdAt) }}</time>
              </div>
            </li>
          }
        </ol>
        @if (hasMore()) {
          <button mat-stroked-button type="button" (click)="loadMore()">Load more</button>
        }
      }
    </section>
  `,
  styles: `
    .activity-panel__empty {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .activity-panel__list {
      list-style: none;
      margin: 0 0 0.75rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-panel__item {
      display: flex;
      gap: 0.75rem;
    }

    .activity-panel__icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface-container-high);
      flex-shrink: 0;
    }

    .activity-panel__description {
      margin: 0 0 0.25rem;
      font: var(--mat-sys-body-medium);
    }

    .activity-panel__time {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPanelComponent implements OnInit {
  readonly taskId = input.required<string>();

  private readonly collaborationService = inject(CollaborationService);

  readonly items = signal<ActivityHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalCount = signal(0);

  ngOnInit(): void {
    this.load();
  }

  hasMore() {
    return this.items().length < this.totalCount();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.page();
    this.collaborationService.loadTaskActivity(this.taskId(), page, 20).subscribe({
      next: (result) => {
        const filtered = result.items.filter((item) => isCollaborationActivity(item.activityType));
        this.items.update((current) => (page === 1 ? filtered : [...current, ...filtered]));
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load activity');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.page.update((page) => page + 1);
    this.load();
  }

  icon(activityType: string) {
    return activityIcon(activityType);
  }

  relativeTime(iso: string) {
    return formatRelativeTime(iso);
  }
}
