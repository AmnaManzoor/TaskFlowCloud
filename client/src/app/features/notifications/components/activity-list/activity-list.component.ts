import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivityCardComponent } from '@features/notifications/components/activity-card/activity-card.component';
import { DateSeparatorComponent } from '@features/notifications/components/date-separator/date-separator.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ActivityStore } from '@features/notifications/stores/activity.store';

@Component({
  selector: 'app-activity-list',
  imports: [
    ActivityCardComponent,
    DateSeparatorComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    EmptyStateComponent,
    MatProgressBarModule,
  ],
  template: `
    <section class="activity-list" aria-label="Activity feed">
      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="retry.emit()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="6" />
      } @else if (store.groupedItems().length === 0) {
        <app-empty-state
          icon="history"
          title="No activity yet"
          description="Recent workspace activity will appear here."
        />
      } @else {
        <div class="activity-list__scroll" (scroll)="onScroll($event)">
          @for (group of store.groupedItems(); track group.dateKey) {
            <app-date-separator [label]="group.label" />
            <div class="activity-list__group">
              @for (item of group.items; track item.id) {
                <app-activity-card [item]="item" />
              }
            </div>
          }

          @if (store.loadingMore()) {
            <mat-progress-bar mode="indeterminate" aria-label="Loading more activity" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .activity-list__scroll {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: calc(100vh - 16rem);
      overflow: auto;
    }

    .activity-list__group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityListComponent {
  readonly store = inject(ActivityStore);

  readonly infiniteScroll = input(true);
  readonly retry = output<void>();

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    if (!this.infiniteScroll()) return;

    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 120) {
      this.store.loadMore();
    }
  }
}
