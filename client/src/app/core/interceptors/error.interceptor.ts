import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '@core/logging/logger.service';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        logger.error('HTTP error', {
          status: error.status,
          url: error.url ?? req.url,
          message: error.message,
        });

        const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => (error.url ?? req.url).includes(endpoint));

        if (error.status === 401 && !isAuthEndpoint) {
          // Session refresh / redirect handled by jwt interceptor.
        } else if (error.status === 403) {
          notifications.error(extractApiErrorMessage(error, 'You do not have permission to perform this action.'));
          if (!router.url.startsWith('/forbidden')) {
            void router.navigate(['/forbidden']);
          }
        } else if (error.status >= 500 && !router.url.startsWith('/server-error')) {
          void router.navigate(['/server-error']);
        } else if (error.status === 0) {
          notifications.error('Network error. Please check your connection.');
        }
      }

      return throwError(() => error);
    }),
  );
};
