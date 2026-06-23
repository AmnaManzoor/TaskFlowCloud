import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectPriorityComponent } from '@features/projects/components/project-priority/project-priority.component';
import { ProjectProgressComponent } from '@features/projects/components/project-progress/project-progress.component';
import { ProjectStatusComponent } from '@features/projects/components/project-status/project-status.component';
import type { Project } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-header',
  imports: [MatButtonModule, MatIconModule, ProjectStatusComponent, ProjectPriorityComponent, ProjectProgressComponent],
  template: `
    @if (project(); as p) {
      <header class="project-header">
        <div class="project-header__main">
          <p class="project-header__code">{{ p.code }}</p>
          <h1 class="project-header__title">{{ p.name }}</h1>
          @if (p.description) {
            <p class="project-header__description">{{ p.description }}</p>
          }
          <div class="project-header__chips">
            <app-project-status [status]="p.status" />
            <app-project-priority [priority]="p.priority" />
            @if (p.isArchived) {
              <span class="project-header__archived">Archived</span>
            }
          </div>
        </div>
        <div class="project-header__progress">
          <app-project-progress [project]="p" />
        </div>
      </header>
    }
  `,
  styles: `
    .project-header {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .project-header__code {
      margin: 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      letter-spacing: 0.08em;
    }

    .project-header__title {
      margin: 0.25rem 0 0;
      font: var(--mat-sys-headline-small);
    }

    .project-header__description {
      margin: 0.5rem 0 0;
      max-width: 40rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .project-header__chips {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .project-header__archived {
      padding: 0.125rem 0.625rem;
      border-radius: 999px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      font: var(--mat-sys-label-medium);
    }

    .project-header__progress {
      min-width: 12rem;
      flex: 1 1 12rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectHeaderComponent {
  readonly project = input.required<Project>();
}
