import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivityListComponent } from '@features/notifications/components/activity-list/activity-list.component';
import { ActivityStore } from '@features/notifications/stores/activity.store';

@Component({
  selector: 'app-activity-timeline',
  imports: [ActivityListComponent],
  template: `
    <div class="activity-timeline">
      <app-activity-list (retry)="store.refresh()" />
    </div>
  `,
  styles: `
    .activity-timeline {
      position: relative;
      padding-left: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineComponent {
  readonly store = inject(ActivityStore);
}
