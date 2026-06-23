import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/notifications/pages/notification-center/notification-center-page.component').then(
        (m) => m.NotificationCenterPageComponent,
      ),
    title: 'Notifications',
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('@features/notifications/pages/activity-center/activity-center-page.component').then(
        (m) => m.ActivityCenterPageComponent,
      ),
    title: 'Activity',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@features/notifications/pages/notification-center/notification-center-page.component').then(
        (m) => m.NotificationCenterPageComponent,
      ),
    title: 'Notification details',
  },
];
