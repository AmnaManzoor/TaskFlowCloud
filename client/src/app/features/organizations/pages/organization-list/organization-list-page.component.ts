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
import { OrganizationCardComponent } from '@features/organizations/components/organization-card/organization-card.component';
import { OrganizationTableComponent } from '@features/organizations/components/organization-table/organization-table.component';
import { SearchToolbarComponent } from '@features/organizations/components/search-toolbar/search-toolbar.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';

@Component({
  selector: 'app-organization-list-page',
  imports: [
    PageHeaderComponent,
    SearchToolbarComponent,
    OrganizationTableComponent,
    OrganizationCardComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  template: `
    <app-page-header title="Organizations" subtitle="Manage workspaces, teams, and members">
      <button actions mat-flat-button type="button" routerLink="/organizations/new">
        <mat-icon aria-hidden="true">add</mat-icon>
        Create organization
      </button>
    </app-page-header>

    <app-search-toolbar
      [search]="store.search()"
      [showStatusFilter]="true"
      (searchChange)="store.setSearch($event)"
      (statusFilterChange)="store.setActiveFilter($event)"
      searchPlaceholder="Search organizations..."
    />

    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="store.loadList()" />
    } @else if (store.loading()) {
      <app-skeleton-loader [rows]="6" />
    } @else if (store.items().length === 0) {
      <app-empty-state
        icon="business"
        title="No organizations yet"
        description="Create your first organization to start collaborating."
        actionLabel="Create organization"
        (actionClick)="router.navigate(['/organizations/new'])"
      />
    } @else {
      <div class="view-toggle">
        <button mat-icon-button type="button" [attr.aria-pressed]="viewMode() === 'table'" (click)="viewMode.set('table')">
          <mat-icon>table_rows</mat-icon>
        </button>
        <button mat-icon-button type="button" [attr.aria-pressed]="viewMode() === 'cards'" (click)="viewMode.set('cards')">
          <mat-icon>grid_view</mat-icon>
        </button>
      </div>

      @if (viewMode() === 'table') {
        <app-organization-table [data]="store.items()" (sortChange)="onSort($event)" />
      } @else {
        <div class="org-grid">
          @for (org of store.items(); track org.id) {
            <app-organization-card [organization]="org" />
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

    .org-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationListPageComponent implements OnInit {
  readonly store = inject(OrganizationStore);
  readonly router = inject(Router);
  readonly viewMode = signal<'table' | 'cards'>('table');

  ngOnInit(): void {
    this.store.loadList();
  }

  onSort(sort: Sort): void {
    if (sort.active) {
      this.store.setSort(sort.active, sort.direction === 'desc');
    }
  }
}
