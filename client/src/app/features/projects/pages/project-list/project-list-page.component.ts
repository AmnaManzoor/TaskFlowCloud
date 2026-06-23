import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Sort } from '@angular/material/sort';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { ProjectCardComponent } from '@features/projects/components/project-card/project-card.component';
import { ProjectTableComponent } from '@features/projects/components/project-table/project-table.component';
import { ProjectToolbarComponent } from '@features/projects/components/project-toolbar/project-toolbar.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { AuthStore } from '@core/stores/auth.store';
import { canCreateProject } from '@features/projects/utils/project-permissions.util';

@Component({
  selector: 'app-project-list-page',
  imports: [
    PageHeaderComponent,
    ProjectToolbarComponent,
    ProjectTableComponent,
    ProjectCardComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  template: `
    <app-page-header title="Projects" subtitle="Browse and manage projects across your organizations">
      @if (canCreate()) {
        <button actions mat-flat-button type="button" routerLink="/projects/new">
          <mat-icon aria-hidden="true">add</mat-icon>
          Create project
        </button>
      }
    </app-page-header>

    <app-project-toolbar
      [search]="store.search()"
      [filters]="store.filters()"
      [organizations]="organizations()"
      (searchChange)="store.setSearch($event)"
      (filtersChange)="store.setFilters($event)"
    />

    <div class="view-toggle">
      <button mat-icon-button type="button" [attr.aria-pressed]="viewMode() === 'table'" (click)="viewMode.set('table')">
        <mat-icon>table_rows</mat-icon>
      </button>
      <button mat-icon-button type="button" [attr.aria-pressed]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
        <mat-icon>grid_view</mat-icon>
      </button>
    </div>

    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="store.loadList()" />
    } @else if (store.loading()) {
      <app-skeleton-loader [rows]="6" />
    } @else if (store.items().length === 0) {
      <app-empty-state
        icon="folder_open"
        title="No projects found"
        description="Create a project or adjust your filters."
        [actionLabel]="canCreate() ? 'Create project' : undefined"
        (actionClick)="router.navigate(['/projects/new'])"
      />
    } @else {
      @if (viewMode() === 'table') {
        <app-project-table
          [data]="store.items()"
          [organizationNames]="orgNameMap()"
          (sortChange)="onSort($event)"
        />
      } @else {
        <div class="project-grid">
          @for (project of store.items(); track project.id) {
            <app-project-card [project]="project" [organizationName]="orgNameMap()[project.organizationId]" />
          }
        </div>
      }

      <app-pagination
        [pageNumber]="store.page()"
        [pageSize]="store.pageSize()"
        [totalCount]="store.totalCount()"
        (pageChange)="store.setPage($event)"
      />
    }
  `,
  styles: `
    .view-toggle {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.75rem;
    }

    .project-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListPageComponent implements OnInit {
  readonly store = inject(ProjectStore);
  readonly orgStore = inject(OrganizationStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  readonly viewMode = signal<'table' | 'grid'>('table');

  ngOnInit(): void {
    this.orgStore.loadList();
    this.orgStore.loadCreatableOrganizations();
    this.store.loadList();
  }

  organizations() {
    return this.orgStore.items().map((org) => ({ id: org.id, name: org.name }));
  }

  orgNameMap(): Record<string, string> {
    return Object.fromEntries(this.orgStore.items().map((org) => [org.id, org.name]));
  }

  canCreate(): boolean {
    return canCreateProject(this.authStore.roles(), this.orgStore.creatableOrganizations().length);
  }

  onSort(sort: Sort): void {
    if (sort.active) {
      this.store.setSort(sort.active, sort.direction === 'desc');
    }
  }
}
