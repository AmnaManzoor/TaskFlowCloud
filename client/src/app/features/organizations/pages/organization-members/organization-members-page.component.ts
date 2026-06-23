import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { AuthStore } from '@core/stores/auth.store';
import { MemberTableComponent } from '@features/organizations/components/member-table/member-table.component';
import {
  AddMemberDialogComponent,
  AddMemberDialogResult,
} from '@features/organizations/dialogs/add-member-dialog.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { UserStore } from '@features/organizations/stores/user.store';
import { canManageOrganization } from '@features/organizations/utils/permissions.util';
import {
  UpdateMemberRoleDialogComponent,
} from '@features/organizations/dialogs/update-member-role-dialog.component';
import type { OrganizationMember } from '@features/organizations/models/organization.models';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';

@Component({
  selector: 'app-organization-members-page',
  imports: [MemberTableComponent, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    <div class="members-page">
      @if (canManage()) {
        <div class="members-page__toolbar">
          <button mat-flat-button type="button" (click)="openAddMember()">
            <mat-icon aria-hidden="true">person_add</mat-icon>
            Add member
          </button>
        </div>
      }

      @if (store.members().length === 0) {
        <app-empty-state icon="group" title="No members yet" description="Invite users to collaborate in this organization." />
      } @else {
        <app-member-table
          [members]="store.members()"
          [showActions]="canManage()"
          (roleChange)="openRoleChange($event)"
          (remove)="confirmRemove($event)"
        />
      }
    </div>
  `,
  styles: `
    .members-page__toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMembersPageComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(OrganizationStore);
  readonly userStore = inject(UserStore);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.store.loadMembers(this.organizationId());
    this.userStore.loadList();
  }

  canManage(): boolean {
    return canManageOrganization(this.authStore.roles(), this.store.currentMemberRole());
  }

  openAddMember(): void {
    const users = this.userStore.items().map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName} (${user.email})`,
    }));

    this.dialog
      .open<AddMemberDialogComponent, unknown, AddMemberDialogResult>(AddMemberDialogComponent, {
        data: { title: 'Add organization member', users, showRole: true },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.userId && result.role !== undefined) {
          this.store.addMember(this.organizationId(), result.userId, result.role);
        }
      });
  }

  openRoleChange(member: OrganizationMember): void {
    this.dialog
      .open<UpdateMemberRoleDialogComponent, { member: OrganizationMember }, OrganizationMemberRole>(
        UpdateMemberRoleDialogComponent,
        { data: { member } },
      )
      .afterClosed()
      .subscribe((role) => {
        if (role !== undefined) {
          this.store.updateMemberRole(this.organizationId(), member.userId, role);
        }
      });
  }

  confirmRemove(member: OrganizationMember): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Remove member',
          message: `Remove ${member.firstName} ${member.lastName} from this organization?`,
          confirmLabel: 'Remove',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.removeMember(this.organizationId(), member.userId);
        }
      });
  }
}
