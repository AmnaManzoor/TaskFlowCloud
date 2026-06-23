import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';
import { organizationRoleLabel } from '@features/organizations/utils/permissions.util';

@Component({
  selector: 'app-role-badge',
  template: `
    <span class="role-badge" [class]="'role-badge--' + roleClass()" role="status">
      {{ organizationRoleLabel(role()) }}
    </span>
  `,
  styles: `
    .role-badge {
      display: inline-flex;
      padding: 0.125rem 0.625rem;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      background: var(--mat-sys-surface-container-high);
    }

    .role-badge--owner {
      background: #ede9fe;
      color: #5b21b6;
    }

    .role-badge--admin {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-badge--manager {
      background: #fef3c7;
      color: #b45309;
    }

    .role-badge--member {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleBadgeComponent {
  readonly role = input.required<OrganizationMemberRole>();
  readonly organizationRoleLabel = organizationRoleLabel;

  roleClass(): string {
    switch (this.role()) {
      case OrganizationMemberRole.Owner:
        return 'owner';
      case OrganizationMemberRole.Administrator:
        return 'admin';
      case OrganizationMemberRole.Manager:
        return 'manager';
      default:
        return 'member';
    }
  }
}
