import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  AddMemberDialogComponent,
  AddMemberDialogResult,
} from '@features/organizations/dialogs/add-member-dialog.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { TeamStore } from '@features/organizations/stores/team.store';
import type { TeamMember } from '@features/organizations/models/team.models';

@Component({
  selector: 'app-team-members-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    UserAvatarComponent,
    EmptyStateComponent,
    DatePipe,
  ],
  template: `
    <div class="team-members">
      <div class="team-members__toolbar">
        <button mat-flat-button type="button" (click)="openAddMember()">
          <mat-icon aria-hidden="true">person_add</mat-icon>
          Assign user
        </button>
      </div>

      @if (store.members().length === 0) {
        <app-empty-state icon="group" title="No team members" description="Assign organization members to this team." />
      } @else {
        <table mat-table [dataSource]="store.members()" class="team-members__table">
          <ng-container matColumnDef="member">
            <th mat-header-cell *matHeaderCellDef>Member</th>
            <td mat-cell *matCellDef="let row">
              <div class="team-members__member">
                <app-user-avatar [name]="row.firstName + ' ' + row.lastName" [size]="32" />
                <div>
                  <div>{{ row.firstName }} {{ row.lastName }}</div>
                  <div class="team-members__email">{{ row.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="joinedAt">
            <th mat-header-cell *matHeaderCellDef>Joined</th>
            <td mat-cell *matCellDef="let row">{{ row.joinedAt | date: 'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button type="button" aria-label="Remove user" (click)="confirmRemove(row)">
                <mat-icon>person_remove</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styles: `
    .team-members__toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .team-members__table {
      width: 100%;
    }

    .team-members__member {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .team-members__email {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMembersPageComponent implements OnInit {
  readonly teamId = input.required<string>({ alias: 'teamId' });
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(TeamStore);
  readonly orgStore = inject(OrganizationStore);
  private readonly dialog = inject(MatDialog);
  readonly columns = ['member', 'joinedAt', 'actions'];

  ngOnInit(): void {
    this.store.loadMembers(this.teamId());
    this.orgStore.loadMembers(this.organizationId());
  }

  openAddMember(): void {
    const existing = new Set(this.store.members().map((member) => member.userId));
    const users = this.orgStore
      .members()
      .filter((member) => !existing.has(member.userId))
      .map((member) => ({
        id: member.userId,
        label: `${member.firstName} ${member.lastName} (${member.email})`,
      }));

    this.dialog
      .open<AddMemberDialogComponent, unknown, AddMemberDialogResult>(AddMemberDialogComponent, {
        data: { title: 'Assign team member', users, showRole: false },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.userId) {
          this.store.addMember(this.teamId(), result.userId);
        }
      });
  }

  confirmRemove(member: TeamMember): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Remove team member',
          message: `Remove ${member.firstName} ${member.lastName} from this team?`,
          confirmLabel: 'Remove',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.removeMember(this.teamId(), member.userId);
        }
      });
  }
}
