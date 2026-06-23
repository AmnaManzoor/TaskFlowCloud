import { organizationRoleLabel } from '@features/organizations/utils/permissions.util';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';

describe('permissions.util', () => {
  it('should map organization role labels', () => {
    expect(organizationRoleLabel(OrganizationMemberRole.Owner)).toBe('Owner');
    expect(organizationRoleLabel(OrganizationMemberRole.Manager)).toBe('Manager');
  });
});
