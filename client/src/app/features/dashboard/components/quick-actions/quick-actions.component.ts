import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { QuickActionButtonComponent } from '@shared/components/quick-action-button/quick-action-button.component';

@Component({
  selector: 'app-quick-actions',
  imports: [DashboardWidgetComponent, QuickActionButtonComponent],
  template: `
    <app-dashboard-widget title="Quick Actions" subtitle="Jump to common workflows" icon="bolt">
      <div class="quick-actions" role="group" aria-label="Quick actions">
        @for (action of actions; track action.label) {
          <app-quick-action-button
            [icon]="action.icon"
            [label]="action.label"
            (actionClick)="navigate(action.route)"
          />
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .quick-actions {
      display: grid;
      gap: 0.625rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  private readonly router = inject(Router);

  readonly actions = [
    { icon: 'create_new_folder', label: 'Create Project', route: '/projects' },
    { icon: 'add_task', label: 'Create Task', route: '/tasks' },
    { icon: 'person_add', label: 'Invite Member', route: '/users' },
    { icon: 'assessment', label: 'View Reports', route: '/dashboard' },
    { icon: 'calendar_month', label: 'Open Calendar', route: '/dashboard' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  navigate(route: string): void {
    void this.router.navigateByUrl(route);
  }
}
