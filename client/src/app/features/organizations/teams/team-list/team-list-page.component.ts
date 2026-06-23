import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchToolbarComponent } from '@features/organizations/components/search-toolbar/search-toolbar.component';
import { AuthStore } from '@core/stores/auth.store';
import { TeamStore } from '@features/organizations/stores/team.store';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { canManageTeams } from '@features/organizations/utils/permissions.util';

@Component({
  selector: 'app-team-list-page',
  imports: [
    SearchToolbarComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    PaginationComponent,
  ],
  template: `
    <app-search-toolbar
      [search]="teamStore.search()"
      (searchChange)="teamStore.setSearch($event)"
      searchPlaceholder="Search teams..."
    >
      @if (canManage()) {
        <button toolbar-actions mat-flat-button type="button" [routerLink]="['new']">
          <mat-icon aria-hidden="true">group_add</mat-icon>
          Create team
        </button>
      }
    </app-search-toolbar>

    @if (teamStore.items().length === 0) {
      <app-empty-state icon="groups" title="No teams yet" description="Create teams to organize members within this organization." />
    } @else {
      <table mat-table [dataSource]="teamStore.items()" class="team-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">
            <a [routerLink]="[row.id]">{{ row.name }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let row">{{ row.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <a mat-icon-button [routerLink]="[row.id, 'members']" aria-label="Team members"><mat-icon>group</mat-icon></a>
            @if (canManage()) {
              <a mat-icon-button [routerLink]="[row.id, 'edit']" aria-label="Edit team"><mat-icon>edit</mat-icon></a>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      <app-pagination
        [pageNumber]="teamStore.page()"
        [pageSize]="teamStore.pageSize()"
        [totalCount]="teamStore.totalCount()"
        (pageChange)="teamStore.setPage($event)"
      />
    }
  `,
  styles: `
    .team-table {
      width: 100%;
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListPageComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly teamStore = inject(TeamStore);
  readonly orgStore = inject(OrganizationStore);
  readonly authStore = inject(AuthStore);
  readonly columns = ['name', 'description', 'actions'];

  ngOnInit(): void {
    this.teamStore.loadList(this.organizationId());
  }

  canManage(): boolean {
    return canManageTeams(this.authStore.roles(), this.orgStore.currentMemberRole());
  }
}
