import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.MAIN_APP_ROUTES),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Not Found',
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Forbidden',
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Session expired',
  },
  {
    path: 'server-error',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Server Error',
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Maintenance',
  },
  {
    path: 'offline',
    loadComponent: () =>
      import('@features/errors/error-page/error-page-container.component').then(
        (m) => m.ErrorPageContainerComponent,
      ),
    title: 'Offline',
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
