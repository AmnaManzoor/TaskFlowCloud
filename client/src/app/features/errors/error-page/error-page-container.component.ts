import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ErrorPageComponent } from '@features/errors/error-page/error-page.component';

const ERROR_CONFIG: Record<
  string,
  { code: string; title: string; message: string; icon: string; showHomeLink: boolean }
> = {
  'not-found': {
    code: '404',
    title: 'Page not found',
    message: 'The page you requested could not be found.',
    icon: 'search_off',
    showHomeLink: true,
  },
  forbidden: {
    code: '403',
    title: 'Access denied',
    message: 'You do not have permission to view this resource.',
    icon: 'lock',
    showHomeLink: true,
  },
  'server-error': {
    code: '500',
    title: 'Server error',
    message: 'Something went wrong on our end. Please try again later.',
    icon: 'error_outline',
    showHomeLink: true,
  },
  maintenance: {
    code: '503',
    title: 'Under maintenance',
    message: 'TaskFlow is temporarily unavailable while we perform maintenance.',
    icon: 'build_circle',
    showHomeLink: false,
  },
  offline: {
    code: 'Offline',
    title: 'You are offline',
    message: 'Check your internet connection and try again.',
    icon: 'wifi_off',
    showHomeLink: false,
  },
  'session-expired': {
    code: '401',
    title: 'Session expired',
    message: 'Your session has expired. Please sign in again to continue.',
    icon: 'schedule',
    showHomeLink: false,
  },
};

@Component({
  selector: 'app-error-page-container',
  imports: [ErrorPageComponent],
  template: `
    <app-error-page
      [code]="config.code"
      [title]="config.title"
      [message]="config.message"
      [icon]="config.icon"
      [showHomeLink]="config.showHomeLink"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageContainerComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly config =
    ERROR_CONFIG[this.route.snapshot.routeConfig?.path ?? 'not-found'] ?? ERROR_CONFIG['not-found'];
}
