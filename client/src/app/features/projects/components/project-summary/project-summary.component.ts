import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { Project } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-summary',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="project-summary">
      @for (stat of stats(); track stat.label) {
        <mat-card class="project-summary__card u-animate-fade-in">
          <mat-icon aria-hidden="true">{{ stat.icon }}</mat-icon>
          <div>
            <p class="project-summary__value">{{ stat.value }}</p>
            <p class="project-summary__label">{{ stat.label }}</p>
          </div>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .project-summary {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    }

    .project-summary__card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
    }

    .project-summary__card mat-icon {
      color: var(--mat-sys-primary);
    }

    .project-summary__value {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .project-summary__label {
      margin: 0.125rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryComponent {
  readonly project = input.required<Project>();

  stats() {
    const p = this.project();
    const summary = p.summary;
    return [
      { icon: 'group', value: summary?.memberCount ?? '—', label: 'Members' },
      { icon: 'task', value: summary?.taskCount ?? '—', label: 'Tasks' },
      { icon: 'person', value: summary?.ownerFullName ?? p.ownerId.slice(0, 8), label: 'Owner' },
      { icon: 'business', value: summary?.organizationName ?? '—', label: 'Organization' },
    ];
  }
}
