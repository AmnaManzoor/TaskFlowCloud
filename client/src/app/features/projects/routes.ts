import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/projects/pages/project-list/project-list-page.component').then(
        (m) => m.ProjectListPageComponent,
      ),
    title: 'Projects',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('@features/projects/pages/project-create/project-create-page.component').then(
        (m) => m.ProjectCreatePageComponent,
      ),
    title: 'Create project',
  },
  {
    path: ':projectId',
    loadComponent: () =>
      import('@features/projects/components/project-shell/project-shell.component').then(
        (m) => m.ProjectShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('@features/projects/pages/project-details/project-details-page.component').then(
            (m) => m.ProjectDetailsPageComponent,
          ),
        title: 'Project overview',
      },
      {
        path: 'members',
        loadComponent: () =>
          import('@features/projects/pages/project-members/project-members-page.component').then(
            (m) => m.ProjectMembersPageComponent,
          ),
        title: 'Project members',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@features/projects/pages/project-settings/project-settings-page.component').then(
            (m) => m.ProjectSettingsPageComponent,
          ),
        title: 'Project settings',
      },
      {
        path: 'edit',
        redirectTo: 'settings',
        pathMatch: 'full',
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('@features/tasks/pages/project-tasks/project-tasks-page.component').then(
            (m) => m.ProjectTasksPageComponent,
          ),
        title: 'Tasks',
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('@features/projects/pages/project-placeholders/project-placeholders.component').then(
            (m) => m.ProjectActivityPlaceholderPageComponent,
          ),
        title: 'Activity',
      },
    ],
  },
];
