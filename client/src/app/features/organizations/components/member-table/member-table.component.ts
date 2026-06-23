import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RoleBadgeComponent } from '@features/organizations/components/role-badge/role-badge.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import type { OrganizationMember } from '@features/organizations/models/organization.models';

@Component({
  selector: 'app-member-table',
  imports: [MatTableModule, MatButtonModule, MatIconModule, UserAvatarComponent, RoleBadgeComponent, DatePipe],
  template: `
    <table mat-table [dataSource]="members()" class="member-table" role="table">
      <ng-container matColumnDef="member">
        <th mat-header-cell *matHeaderCellDef scope="col">Member</th>
        <td mat-cell *matCellDef="let row">
          <div class="member-table__member">
            <app-user-avatar [name]="row.firstName + ' ' + row.lastName" [size]="32" />
            <div>
              <div class="member-table__name">{{ row.firstName }} {{ row.lastName }}</div>
              <div class="member-table__email">{{ row.email }}</div>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef scope="col">Role</th>
        <td mat-cell *matCellDef="let row">
          <app-role-badge [role]="row.role" />
        </td>
      </ng-container>

      <ng-container matColumnDef="joinedAt">
        <th mat-header-cell *matHeaderCellDef scope="col">Joined</th>
        <td mat-cell *matCellDef="let row">{{ row.joinedAt | date: 'mediumDate' }}</td>
      </ng-container>

      @if (showActions()) {
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef scope="col">Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button type="button" aria-label="Change role" (click)="roleChange.emit(row)">
              <mat-icon>admin_panel_settings</mat-icon>
            </button>
            <button mat-icon-button type="button" aria-label="Remove member" (click)="remove.emit(row)">
              <mat-icon>person_remove</mat-icon>
            </button>
          </td>
        </ng-container>
      }

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  `,
  styles: `
    .member-table {
      width: 100%;
    }

    .member-table__member {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .member-table__name {
      font: var(--mat-sys-body-medium);
    }

    .member-table__email {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberTableComponent {
  readonly members = input<OrganizationMember[]>([]);
  readonly showActions = input(true);

  readonly roleChange = output<OrganizationMember>();
  readonly remove = output<OrganizationMember>();

  get columns(): string[] {
    return this.showActions() ? ['member', 'role', 'joinedAt', 'actions'] : ['member', 'role', 'joinedAt'];
  }
}
