import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { SearchToolbarComponent } from '@features/organizations/components/search-toolbar/search-toolbar.component';
import { UserStore } from '@features/organizations/stores/user.store';

@Component({
  selector: 'app-user-list-page',
  imports: [
    PageHeaderComponent,
    SearchToolbarComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    StatusBadgeComponent,
    UserAvatarComponent,
  ],
  template: `
    <app-page-header title="Users" subtitle="Manage user accounts, roles, and access">
      <a actions mat-stroked-button routerLink="/profile">My profile</a>
    </app-page-header>

    <app-search-toolbar
      [search]="store.search()"
      [showStatusFilter]="true"
      (searchChange)="store.setSearch($event)"
      (statusFilterChange)="store.setActiveFilter($event)"
      searchPlaceholder="Search users by name or email..."
    />

    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="store.loadList()" />
    } @else if (store.loading()) {
      <app-skeleton-loader [rows]="6" />
    } @else if (store.items().length === 0) {
      <app-empty-state icon="people" title="No users found" description="Try adjusting your search or filters." />
    } @else {
      <table mat-table [dataSource]="store.items()" class="user-table">
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>User</th>
          <td mat-cell *matCellDef="let row">
            <div class="user-table__user">
              <app-user-avatar [name]="row.firstName + ' ' + row.lastName" [imageUrl]="row.profileImageUrl ?? undefined" />
              <div>
                <a [routerLink]="[row.id]" class="user-table__link">{{ row.firstName }} {{ row.lastName }}</a>
                <div class="user-table__email">{{ row.email }}</div>
              </div>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <app-status-badge
              [label]="row.isActive ? (row.isLockedOut ? 'Locked' : 'Active') : 'Inactive'"
              [variant]="row.isActive && !row.isLockedOut ? 'success' : 'warning'"
            />
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <a mat-icon-button [routerLink]="[row.id]" aria-label="View user"><mat-icon>visibility</mat-icon></a>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      <app-pagination
        [pageNumber]="store.page()"
        [pageSize]="store.pageSize()"
        [totalCount]="store.totalCount()"
        (pageChange)="store.setPage($event)"
      />
    }
  `,
  styles: `
    .user-table {
      width: 100%;
      margin-bottom: 1rem;
    }

    .user-table__user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-table__link {
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .user-table__email {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPageComponent implements OnInit {
  readonly store = inject(UserStore);
  readonly columns = ['user', 'status', 'actions'];

  ngOnInit(): void {
    this.store.loadList();
  }
}
