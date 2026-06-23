import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import type { Organization } from '@features/organizations/models/organization.models';

@Component({
  selector: 'app-organization-table',
  imports: [MatTableModule, MatSortModule, MatButtonModule, MatIconModule, RouterLink, StatusBadgeComponent, DatePipe],
  template: `
    <table mat-table [dataSource]="data()" matSort (matSortChange)="sortChange.emit($event)" class="org-table">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header scope="col">Name</th>
        <td mat-cell *matCellDef="let row">
          <a [routerLink]="['/organizations', row.id]" class="org-table__link">{{ row.name }}</a>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef scope="col">Status</th>
        <td mat-cell *matCellDef="let row">
          <app-status-badge
            [label]="row.isActive ? 'Active' : 'Inactive'"
            [variant]="row.isActive ? 'success' : 'warning'"
          />
        </td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef mat-sort-header scope="col">Created</th>
        <td mat-cell *matCellDef="let row">{{ row.createdAt | date: 'mediumDate' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef scope="col">Actions</th>
        <td mat-cell *matCellDef="let row">
          <a mat-icon-button [routerLink]="['/organizations', row.id]" aria-label="View organization">
            <mat-icon>visibility</mat-icon>
          </a>
          @if (canManage()) {
            <a mat-icon-button [routerLink]="['/organizations', row.id, 'edit']" aria-label="Edit organization">
              <mat-icon>edit</mat-icon>
            </a>
          }
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  `,
  styles: `
    .org-table {
      width: 100%;
    }

    .org-table__link {
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .org-table__link:hover {
      text-decoration: underline;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationTableComponent {
  readonly data = input<Organization[]>([]);
  readonly canManage = input(true);
  readonly sortChange = output<Sort>();

  readonly displayedColumns = ['name', 'status', 'createdAt', 'actions'];
}
