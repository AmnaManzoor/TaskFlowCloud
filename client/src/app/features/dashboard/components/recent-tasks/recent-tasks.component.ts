import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { PriorityChipComponent } from '@shared/components/priority-chip/priority-chip.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { UserAvatarGroupComponent } from '@shared/components/user-avatar-group/user-avatar-group.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-recent-tasks',
  imports: [
    DashboardWidgetComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    StatusChipComponent,
    PriorityChipComponent,
    UserAvatarGroupComponent,
    DatePipe,
  ],
  template: `
    <app-dashboard-widget
      title="Recent Tasks"
      subtitle="Upcoming and active assignments"
      icon="checklist"
      actionLabel="View all"
      [loading]="store.loading()"
      [empty]="store.recentTasks().length === 0"
      emptyTitle="No tasks assigned"
      emptyDescription="Tasks assigned to you will appear here."
    >
      <div class="task-list" role="list">
        @for (task of store.recentTasks(); track task.id) {
          <article class="task-list__item u-animate-fade-in" role="listitem">
            <div class="task-list__main">
              <div class="task-list__title-row">
                <h3 class="task-list__title">{{ task.title }}</h3>
                <app-status-chip [taskStatus]="task.status" />
              </div>
              <div class="task-list__meta">
                <app-priority-chip [taskPriority]="task.priority" />
                <span>{{ task.projectName }}</span>
                @if (task.dueDate) {
                  <span>Due {{ task.dueDate | date: 'mediumDate' }}</span>
                }
              </div>
              <app-user-avatar-group
                [members]="assignees(task.assigneeIds)"
                ariaLabel="Assigned users"
              />
            </div>
            <button mat-icon-button type="button" aria-label="Open task" [routerLink]="['/tasks']">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </article>
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-list__item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.875rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-lowest);
    }

    .task-list__item:hover {
      background: var(--mat-sys-surface-container);
    }

    .task-list__title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .task-list__title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .task-list__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 0.375rem 0 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentTasksComponent {
  readonly store = inject(DashboardStore);

  assignees(ids: string[]) {
    return ids.map((id) => ({ id, name: id.slice(0, 8) }));
  }
}
