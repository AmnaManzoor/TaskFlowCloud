import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@core/authentication/pages/profile-page/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
    title: 'Profile',
  },
];
