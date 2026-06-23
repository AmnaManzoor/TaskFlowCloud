import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { PriorityChipComponent } from '@shared/components/priority-chip/priority-chip.component';
import { ProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { UserAvatarGroupComponent } from '@shared/components/user-avatar-group/user-avatar-group.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';
import type { ProjectReportItem, ProjectSummaryItem } from '@features/dashboard/models/dashboard.models';
import { ProjectStatus } from '@features/dashboard/models/dashboard.models';

@Component({
  selector: 'app-recent-projects',
  imports: [
    DashboardWidgetComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    StatusChipComponent,
    PriorityChipComponent,
    ProgressBarComponent,
    UserAvatarGroupComponent,
  ],
  template: `
    <app-dashboard-widget
      title="Recent Projects"
      subtitle="Latest updates across your workspace"
      icon="folder_open"
      actionLabel="View all"
      [loading]="store.loading()"
      [empty]="store.recentProjects().length === 0"
      emptyTitle="No projects yet"
      emptyDescription="Create a project to start organizing work."
      (actionClick)="null"
    >
      <div class="project-list" role="list">
        @for (project of store.recentProjects(); track trackProject($index, project)) {
          <article class="project-list__item u-animate-fade-in" role="listitem">
            <div class="project-list__main">
              <div class="project-list__title-row">
                <h3 class="project-list__title">{{ projectName(project) }}</h3>
                <app-status-chip [projectStatus]="projectStatus(project)" />
              </div>
              <p class="project-list__meta">
                @if (isReportItem(project)) {
                  <app-priority-chip [projectPriority]="project.priority" />
                  <span>{{ project.completedTaskCount }}/{{ project.taskCount }} tasks</span>
                } @else {
                  <span>{{ project.code }}</span>
                }
              </p>
              @if (isReportItem(project)) {
                <app-progress-bar
                  [value]="project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0"
                />
              }
              <div class="project-list__footer">
                <app-user-avatar-group [members]="[{ id: ownerId(project), name: ownerId(project) }]" [maxVisible]="1" />
                <span>{{ updatedLabel(project) }}</span>
              </div>
            </div>
            <button mat-icon-button type="button" aria-label="Open project" [routerLink]="['/projects']">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </article>
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .project-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .project-list__item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.875rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-lowest);
      transition: background 160ms ease;
    }

    .project-list__item:hover {
      background: var(--mat-sys-surface-container);
    }

    .project-list__main {
      flex: 1;
      min-width: 0;
    }

    .project-list__title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .project-list__title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .project-list__meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.375rem 0 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .project-list__footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentProjectsComponent {
  readonly store = inject(DashboardStore);

  trackProject(_index: number, project: ProjectSummaryItem | ProjectReportItem): string {
    return project.id;
  }

  projectName(project: ProjectSummaryItem | ProjectReportItem): string {
    return project.name;
  }

  projectStatus(project: ProjectSummaryItem | ProjectReportItem): ProjectStatus {
    return project.status;
  }

  isReportItem(project: ProjectSummaryItem | ProjectReportItem): project is ProjectReportItem {
    return 'taskCount' in project;
  }

  ownerId(project: ProjectSummaryItem | ProjectReportItem): string {
    return this.isReportItem(project) ? project.ownerId : 'owner';
  }

  updatedLabel(project: ProjectSummaryItem | ProjectReportItem): string {
    const date = this.isReportItem(project) ? project.createdAt : project.updatedAt;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
