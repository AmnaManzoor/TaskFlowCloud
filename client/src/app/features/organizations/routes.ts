import { Routes } from '@angular/router';

export const ORGANIZATION_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/organizations/pages/organization-list/organization-list-page.component').then(
        (m) => m.OrganizationListPageComponent,
      ),
    title: 'Organizations',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('@features/organizations/pages/organization-create/organization-create-page.component').then(
        (m) => m.OrganizationCreatePageComponent,
      ),
    title: 'Create organization',
  },
  {
    path: ':organizationId',
    loadComponent: () =>
      import('@features/organizations/components/organization-shell/organization-shell.component').then(
        (m) => m.OrganizationShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('@features/organizations/pages/organization-details/organization-details-page.component').then(
            (m) => m.OrganizationDetailsPageComponent,
          ),
        title: 'Organization overview',
      },
      {
        path: 'members',
        loadComponent: () =>
          import('@features/organizations/pages/organization-members/organization-members-page.component').then(
            (m) => m.OrganizationMembersPageComponent,
          ),
        title: 'Organization members',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@features/organizations/pages/organization-edit/organization-edit-page.component').then(
            (m) => m.OrganizationEditPageComponent,
          ),
        title: 'Organization settings',
      },
      {
        path: 'edit',
        redirectTo: 'settings',
        pathMatch: 'full',
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('@features/organizations/teams/team-list/team-list-page.component').then(
            (m) => m.TeamListPageComponent,
          ),
        title: 'Teams',
      },
      {
        path: 'teams/new',
        loadComponent: () =>
          import('@features/organizations/teams/team-create/team-create-page.component').then(
            (m) => m.TeamCreatePageComponent,
          ),
        title: 'Create team',
      },
      {
        path: 'teams/:teamId',
        loadComponent: () =>
          import('@features/organizations/teams/team-details/team-details-page.component').then(
            (m) => m.TeamDetailsPageComponent,
          ),
        title: 'Team details',
      },
      {
        path: 'teams/:teamId/edit',
        loadComponent: () =>
          import('@features/organizations/teams/team-edit/team-edit-page.component').then(
            (m) => m.TeamEditPageComponent,
          ),
        title: 'Edit team',
      },
      {
        path: 'teams/:teamId/members',
        loadComponent: () =>
          import('@features/organizations/teams/team-members/team-members-page.component').then(
            (m) => m.TeamMembersPageComponent,
          ),
        title: 'Team members',
      },
    ],
  },
];

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/organizations/users/user-list/user-list-page.component').then(
        (m) => m.UserListPageComponent,
      ),
    title: 'Users',
  },
  {
    path: ':userId',
    loadComponent: () =>
      import('@features/organizations/users/user-details/user-details-page.component').then(
        (m) => m.UserDetailsPageComponent,
      ),
    title: 'User details',
  },
  {
    path: ':userId/profile',
    loadComponent: () =>
      import('@features/organizations/users/user-profile/user-profile-page.component').then(
        (m) => m.UserProfilePageComponent,
      ),
    title: 'Edit user profile',
  },
];
