import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/settings/pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
    title: 'Settings',
  },
];
