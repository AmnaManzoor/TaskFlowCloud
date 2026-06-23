import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { ActivityChartComponent } from '@features/dashboard/components/activity-chart/activity-chart.component';
import { ActivityFeedComponent } from '@features/dashboard/components/activity-feed/activity-feed.component';
import { CalendarWidgetComponent } from '@features/dashboard/components/calendar-widget/calendar-widget.component';
import { DashboardHeaderComponent } from '@features/dashboard/components/dashboard-header/dashboard-header.component';
import { NotificationsWidgetComponent } from '@features/dashboard/components/notifications-widget/notifications-widget.component';
import { PriorityChartComponent } from '@features/dashboard/components/priority-chart/priority-chart.component';
import { ProductivityChartComponent } from '@features/dashboard/components/productivity-chart/productivity-chart.component';
import { ProjectProgressComponent } from '@features/dashboard/components/project-progress/project-progress.component';
import { QuickActionsComponent } from '@features/dashboard/components/quick-actions/quick-actions.component';
import { RecentProjectsComponent } from '@features/dashboard/components/recent-projects/recent-projects.component';
import { RecentTasksComponent } from '@features/dashboard/components/recent-tasks/recent-tasks.component';
import { StatCardComponent } from '@features/dashboard/components/stat-card/stat-card.component';
import { TaskStatusChartComponent } from '@features/dashboard/components/task-status-chart/task-status-chart.component';
import { WorkloadChartComponent } from '@features/dashboard/components/workload-chart/workload-chart.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardHeaderComponent,
    StatCardComponent,
    TaskStatusChartComponent,
    PriorityChartComponent,
    ProductivityChartComponent,
    ActivityChartComponent,
    WorkloadChartComponent,
    ProjectProgressComponent,
    RecentTasksComponent,
    RecentProjectsComponent,
    ActivityFeedComponent,
    NotificationsWidgetComponent,
    QuickActionsComponent,
    CalendarWidgetComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="dashboard-page" @pageEnter>
      <app-dashboard-header />

      @if (store.error()) {
        <app-widget-error
          title="Unable to load dashboard"
          [message]="store.error()"
          (retry)="retry()"
        />
      } @else {
        <section class="dashboard-stats" aria-label="Statistics" @cardStagger>
          @for (card of store.statCards(); track card.id) {
            <app-stat-card [card]="card" [loading]="store.loading()" />
          }
        </section>

        <section class="dashboard-grid" aria-label="Dashboard widgets">
          <div class="dashboard-grid__charts">
            <app-task-status-chart />
            <app-priority-chart />
            <app-productivity-chart />
            <app-activity-chart />
            <app-workload-chart />
            <app-project-progress />
          </div>

          <div class="dashboard-grid__main">
            <app-recent-tasks />
            <app-recent-projects />
          </div>

          <aside class="dashboard-grid__aside">
            <app-activity-feed />
            <app-notifications-widget />
            <app-quick-actions />
            <app-calendar-widget />
          </aside>
        </section>
      }
    </div>
  `,
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('240ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('cardStagger', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(12px)' }),
            stagger(60, [animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class DashboardPageComponent implements OnInit {
  readonly store = inject(DashboardStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 959px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  ngOnInit(): void {
    this.store.load();
  }

  retry(): void {
    this.store.clearError();
    this.store.load();
  }
}
