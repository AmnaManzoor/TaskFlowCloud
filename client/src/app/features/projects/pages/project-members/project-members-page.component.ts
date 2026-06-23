import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MemberListComponent } from '@features/projects/components/member-list/member-list.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  AddProjectMemberDialogComponent,
  AddProjectMemberDialogResult,
} from '@features/projects/dialogs/add-project-member-dialog.component';
import { UpdateProjectMemberRoleDialogComponent } from '@features/projects/dialogs/update-project-member-role-dialog.component';
import { UserStore } from '@features/organizations/stores/user.store';
import { AuthStore } from '@core/stores/auth.store';
import { ProjectStore } from '@features/projects/stores/project.store';
import { canManageProjectMembers } from '@features/projects/utils/project-permissions.util';
import type { ProjectMember } from '@features/projects/models/project.models';
import { ProjectRole } from '@features/projects/models/project.enums';

@Component({
  selector: 'app-project-members-page',
  imports: [MemberListComponent, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    @if (canManage()) {
      <div class="members-toolbar">
        <button mat-flat-button type="button" (click)="openAddMember()">
          <mat-icon aria-hidden="true">person_add</mat-icon>
          Add member
        </button>
      </div>
    }

    @if (store.members().length === 0) {
      <app-empty-state icon="group" title="No members" description="Add team members to collaborate on this project." />
    } @else {
      <app-member-list
        [members]="store.members()"
        [showActions]="canManage()"
        (roleChange)="openRoleChange($event)"
        (remove)="confirmRemove($event)"
      />
    }
  `,
  styles: `
    .members-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersPageComponent implements OnInit {
  readonly projectId = input.required<string>({ alias: 'projectId' });
  readonly store = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.store.loadMembers(this.projectId());
    this.userStore.loadList();
  }

  canManage(): boolean {
    return canManageProjectMembers(this.authStore.roles(), this.store.currentUserRole());
  }

  openAddMember(): void {
    const existing = new Set(this.store.members().map((m) => m.userId));
    const users = this.userStore
      .items()
      .filter((u) => !existing.has(u.id))
      .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }));

    this.dialog
      .open<AddProjectMemberDialogComponent, unknown, AddProjectMemberDialogResult>(AddProjectMemberDialogComponent, {
        data: { users },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.store.addMember(this.projectId(), result.userId, result.role);
        }
      });
  }

  openRoleChange(member: ProjectMember): void {
    this.dialog
      .open<UpdateProjectMemberRoleDialogComponent, { member: ProjectMember }, ProjectRole>(
        UpdateProjectMemberRoleDialogComponent,
        { data: { member } },
      )
      .afterClosed()
      .subscribe((role) => {
        if (role !== undefined) {
          this.store.updateMemberRole(this.projectId(), member.userId, role);
        }
      });
  }

  confirmRemove(member: ProjectMember): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Remove member',
          message: `Remove ${member.firstName} ${member.lastName} from this project?`,
          confirmLabel: 'Remove',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.store.removeMember(this.projectId(), member.userId));
  }
}
