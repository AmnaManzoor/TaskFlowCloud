import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ActivityFilterComponent } from '@features/notifications/components/activity-filter/activity-filter.component';
import { ActivityTimelineComponent } from '@features/notifications/components/activity-timeline/activity-timeline.component';
import { ActivityStore } from '@features/notifications/stores/activity.store';

@Component({
  selector: 'app-activity-center-page',
  imports: [
    RouterLink,
    MatButtonModule,
    ActivityFilterComponent,
    ActivityTimelineComponent,
  ],
  template: `
    <div class="activity-center">
      <header class="activity-center__header">
        <div>
          <h1 class="activity-center__title">Activity Center</h1>
          <p class="activity-center__subtitle">Recent workspace, project, and personal activity.</p>
        </div>
        <button mat-stroked-button type="button" (click)="store.refresh()">Refresh</button>
      </header>

      <app-activity-filter />
      <app-activity-timeline />

      <div class="activity-center__footer">
        <a mat-button routerLink="/notifications">Back to notifications</a>
      </div>
    </div>
  `,
  styles: `
    .activity-center {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-center__header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .activity-center__title {
      margin: 0;
      font: var(--mat-sys-headline-medium);
    }

    .activity-center__subtitle {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .activity-center__footer {
      display: flex;
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCenterPageComponent implements OnInit {
  readonly store = inject(ActivityStore);

  ngOnInit(): void {
    this.store.loadInitial();
  }
}
