import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ProjectSummaryComponent } from '@features/projects/components/project-summary/project-summary.component';
import { ProjectStore } from '@features/projects/stores/project.store';

@Component({
  selector: 'app-project-details-page',
  imports: [MatCardModule, MatButtonModule, RouterLink, ProjectSummaryComponent, EmptyStateComponent, DatePipe],
  template: `
    @if (store.selected(); as project) {
      <app-project-summary [project]="project" />

      <div class="details-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Timeline</mat-card-title></mat-card-header>
          <mat-card-content class="details-grid__content">
            <p><strong>Start:</strong> {{ project.startDate ? (project.startDate | date: 'mediumDate') : '—' }}</p>
            <p><strong>End:</strong> {{ project.endDate ? (project.endDate | date: 'mediumDate') : '—' }}</p>
            <p>
              <strong>Est. completion:</strong>
              {{ project.estimatedCompletionDate ? (project.estimatedCompletionDate | date: 'mediumDate') : '—' }}
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Quick actions</mat-card-title></mat-card-header>
          <mat-card-content class="details-grid__actions">
            <a mat-stroked-button [routerLink]="['../members']">Manage members</a>
            <a mat-stroked-button [routerLink]="['../settings']">Project settings</a>
            <a mat-stroked-button [routerLink]="['../tasks']">View tasks</a>
          </mat-card-content>
        </mat-card>
      </div>

      <section class="details-placeholders">
        <mat-card>
          <mat-card-header><mat-card-title>Tasks</mat-card-title></mat-card-header>
          <mat-card-content>
            <app-empty-state
              icon="task"
              title="Tasks coming soon"
              description="Task management will be available in the next module."
            />
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Reports</mat-card-title></mat-card-header>
          <mat-card-content>
            <app-empty-state
              icon="assessment"
              title="Reports coming soon"
              description="Project reports will be available in a future release."
            />
          </mat-card-content>
        </mat-card>
      </section>
    }
  `,
  styles: `
    .details-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      margin: 1.25rem 0;
    }

    .details-grid__content p {
      margin: 0.375rem 0;
    }

    .details-grid__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .details-placeholders {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsPageComponent {
  readonly projectId = input.required<string>({ alias: 'projectId' });
  readonly store = inject(ProjectStore);
}
