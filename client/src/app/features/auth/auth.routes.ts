import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('@core/authentication/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Sign in',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@core/authentication/pages/register-page/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
    title: 'Register',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@core/authentication/pages/forgot-password-page/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
    title: 'Forgot password',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@core/authentication/pages/reset-password-page/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent,
      ),
    title: 'Reset password',
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('@core/authentication/pages/verify-email-page/verify-email-page.component').then(
        (m) => m.VerifyEmailPageComponent,
      ),
    title: 'Verify email',
  },
];

export const MAIN_APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('@features/projects/projects.routes').then((m) => m.PROJECTS_ROUTES),
  },
  {
    path: 'tasks',
    loadChildren: () => import('@features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
  },
  {
    path: 'collaboration',
    loadChildren: () =>
      import('@features/collaboration/collaboration.routes').then((m) => m.COLLABORATION_APP_ROUTES),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('@features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES),
  },
  {
    path: 'reports',
    loadChildren: () => import('@features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'users',
    loadChildren: () => import('@features/users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'organizations',
    loadChildren: () =>
      import('@features/organizations/organizations.routes').then((m) => m.ORGANIZATIONS_ROUTES),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('@features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('@core/authentication/pages/profile-page/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
    title: 'Profile',
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('@core/authentication/pages/change-password-page/change-password-page.component').then(
        (m) => m.ChangePasswordPageComponent,
      ),
    title: 'Change password',
  },
];
