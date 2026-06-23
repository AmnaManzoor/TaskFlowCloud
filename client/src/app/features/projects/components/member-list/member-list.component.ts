import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { projectRoleLabel } from '@features/projects/models/project.utils';
import type { ProjectMember } from '@features/projects/models/project.models';

@Component({
  selector: 'app-member-list',
  imports: [MatTableModule, MatButtonModule, MatIconModule, UserAvatarComponent, DatePipe],
  template: `
    <table mat-table [dataSource]="members()" class="member-list">
      <ng-container matColumnDef="member">
        <th mat-header-cell *matHeaderCellDef>Member</th>
        <td mat-cell *matCellDef="let row">
          <div class="member-list__member">
            <app-user-avatar [name]="row.firstName + ' ' + row.lastName" [size]="32" />
            <div>
              <div>{{ row.firstName }} {{ row.lastName }}</div>
              <div class="member-list__email">{{ row.email }}</div>
            </div>
          </div>
        </td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Role</th>
        <td mat-cell *matCellDef="let row">
          <span class="member-list__role">{{ projectRoleLabel(row.role) }}</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="joinedAt">
        <th mat-header-cell *matHeaderCellDef>Joined</th>
        <td mat-cell *matCellDef="let row">{{ row.joinedAt | date: 'mediumDate' }}</td>
      </ng-container>
      @if (showActions()) {
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
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
    .member-list {
      width: 100%;
    }

    .member-list__member {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .member-list__email {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .member-list__role {
      font: var(--mat-sys-label-large);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListComponent {
  readonly members = input<ProjectMember[]>([]);
  readonly showActions = input(true);

  readonly roleChange = output<ProjectMember>();
  readonly remove = output<ProjectMember>();

  readonly projectRoleLabel = projectRoleLabel;

  get columns(): string[] {
    return this.showActions() ? ['member', 'role', 'joinedAt', 'actions'] : ['member', 'role', 'joinedAt'];
  }
}
