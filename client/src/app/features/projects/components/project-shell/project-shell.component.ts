import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { ProjectHeaderComponent } from '@features/projects/components/project-header/project-header.component';
import { ProjectStore } from '@features/projects/stores/project.store';

@Component({
  selector: 'app-project-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatTabsModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    ProjectHeaderComponent,
  ],
  template: `
    <div class="project-shell">
      <app-breadcrumb [items]="breadcrumbs()" />

      @if (store.loading() && !store.selected()) {
        <app-skeleton-loader [rows]="5" />
      } @else if (store.selected(); as project) {
        <app-project-header [project]="project" />

        <nav mat-tab-nav-bar [tabPanel]="tabPanel" aria-label="Project sections">
          @for (tab of tabs; track tab.path) {
            <a mat-tab-link [routerLink]="tab.path" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">
              {{ tab.label }}
            </a>
          }
        </nav>
        <mat-tab-nav-panel #tabPanel>
          <div class="project-shell__content">
            <router-outlet />
          </div>
        </mat-tab-nav-panel>
      }
    </div>
  `,
  styles: `
    .project-shell__content {
      padding-top: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent implements OnInit {
  readonly projectId = input.required<string>({ alias: 'projectId' });
  readonly store = inject(ProjectStore);

  readonly tabs = [
    { label: 'Overview', path: 'overview' },
    { label: 'Members', path: 'members' },
    { label: 'Settings', path: 'settings' },
    { label: 'Tasks', path: 'tasks' },
    { label: 'Activity', path: 'activity' },
  ];

  ngOnInit(): void {
    this.store.loadById(this.projectId());
    this.store.loadMembers(this.projectId());
  }

  breadcrumbs() {
    const project = this.store.selected();
    return [
      { label: 'Projects', route: '/projects' },
      { label: project?.name ?? 'Project' },
    ];
  }
}
