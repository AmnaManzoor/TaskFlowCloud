import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/authentication/services/auth.service';
import { TokenService } from '@core/authentication/services/token.service';
import { AuthStore } from '@core/authentication/stores/auth.store';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH) || isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  const token = authStore.accessToken() ?? tokenService.getAccessToken();
  const authReq = token ? appendBearerToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401 || !token || req.context.get(SKIP_AUTH)) {
        return throwError(() => error);
      }

      return authService.refreshTokens().pipe(
        switchMap((response) => next(appendBearerToken(req, response.accessToken))),
        catchError((refreshError) => {
          authService.handleSessionExpired();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function appendBearerToken(req: Parameters<HttpInterceptorFn>[0], token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isPublicAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}
