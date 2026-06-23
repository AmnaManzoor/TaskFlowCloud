import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserAvatarGroupComponent } from '@shared/components/user-avatar-group/user-avatar-group.component';
import { ProjectPriorityComponent } from '@features/projects/components/project-priority/project-priority.component';
import { ProjectProgressComponent } from '@features/projects/components/project-progress/project-progress.component';
import { ProjectStatusComponent } from '@features/projects/components/project-status/project-status.component';
import type { Project } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ProjectStatusComponent,
    ProjectPriorityComponent,
    ProjectProgressComponent,
    UserAvatarGroupComponent,
    DatePipe,
  ],
  template: `
    <article class="project-card u-animate-fade-in">
      <div class="project-card__header">
        <div>
          <p class="project-card__code">{{ project().code }}</p>
          <h3 class="project-card__title">{{ project().name }}</h3>
        </div>
        <app-project-status [status]="project().status" />
      </div>

      <div class="project-card__meta">
        <app-project-priority [priority]="project().priority" />
        @if (organizationName()) {
          <span>{{ organizationName() }}</span>
        }
      </div>

      <app-project-progress [project]="project()" />

      <div class="project-card__footer">
        <app-user-avatar-group
          [members]="[{ id: project().ownerId, name: ownerName() }]"
          [maxVisible]="1"
        />
        <time [dateTime]="project().createdAt">{{ project().createdAt | date: 'mediumDate' }}</time>
      </div>

      <div class="project-card__actions">
        <a mat-stroked-button [routerLink]="['/projects', project().id]">Open</a>
      </div>
    </article>
  `,
  styles: `
    .project-card {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
    }

    .project-card__header {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .project-card__code {
      margin: 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
      letter-spacing: 0.06em;
    }

    .project-card__title {
      margin: 0.125rem 0 0;
      font: var(--mat-sys-title-medium);
    }

    .project-card__meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .project-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly organizationName = input<string | undefined>(undefined);

  ownerName(): string {
    return this.project().summary?.ownerFullName ?? this.project().ownerId.slice(0, 8);
  }
}
