import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { AuthApiService } from '@core/authentication/services/auth-api.service';
import { TokenService } from '@core/authentication/services/token.service';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { LoggerService } from '@core/logging/logger.service';
import { NotificationService } from '@core/services/notification.service';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateUserProfileRequest,
  UserProfile,
  VerifyEmailRequest,
} from '@core/authentication/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenService = inject(TokenService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationService);

  private refreshInFlight$: Observable<AuthResponse> | null = null;
  private sessionGeneration = 0;

  constructor() {
    this.tokenService.registerRefreshCallback(() => {
      void this.refreshSession(false);
    });
  }

  initializeFromStorage(): void {
    if (!this.tokenService.hasStoredSession() || this.tokenService.isAccessTokenExpired()) {
      return;
    }

    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      this.authStore.setAccessToken(accessToken);
    }
  }

  hasValidSession(): boolean {
    const accessToken = this.authStore.accessToken() ?? this.tokenService.getAccessToken();
    return !!accessToken && !this.tokenService.isAccessTokenExpired();
  }

  async tryRestoreSession(): Promise<boolean> {
    if (!this.tokenService.hasStoredSession()) {
      return false;
    }

    if (!this.tokenService.isAccessTokenExpired()) {
      const accessToken = this.tokenService.getAccessToken();
      if (!accessToken) {
        return false;
      }

      this.authStore.setAccessToken(accessToken);

      try {
        await this.loadCurrentUser();
        return true;
      } catch {
        return this.refreshSession(false);
      }
    }

    return this.refreshSession(false);
  }

  login(request: LoginRequest, rememberMe: boolean): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    return this.authApi.login(request).pipe(
      tap((response) => this.applyAuthResponse(response, rememberMe)),
      finalize(() => this.authStore.setLoading(false)),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    return this.authApi.register(request).pipe(
      tap((response) => this.applyAuthResponse(response, true)),
      finalize(() => this.authStore.setLoading(false)),
    );
  }

  logout(showMessage = true): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    const request$ = refreshToken
      ? this.authApi.logout({ refreshToken }).pipe(catchError(() => of({ message: 'Logged out.' })))
      : of({ message: 'Logged out.' });

    return request$.pipe(
      tap(() => {
        this.clearSession();
        if (showMessage) {
          this.notifications.success('You have been signed out.');
        }
        void this.router.navigate(['/login']);
      }),
      catchError((error) => {
        this.clearSession();
        void this.router.navigate(['/login']);
        return throwError(() => error);
      }),
      map(() => undefined),
    );
  }

  refreshSession(redirectOnFailure = true): Promise<boolean> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      if (redirectOnFailure) {
        this.handleSessionExpired();
      }
      return Promise.resolve(false);
    }

    return firstValueFrom(
      this.refreshTokens().pipe(
        catchError((error) => {
          this.logger.warn('Refresh token failed', { message: extractApiErrorMessage(error) });
          if (redirectOnFailure) {
            this.handleSessionExpired();
          } else {
            this.clearSession();
          }
          return of(null);
        }),
      ),
    ).then((response) => !!response);
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token is missing.'));
    }

    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.authApi.refreshToken({ refreshToken }).pipe(
        tap((response) =>
          this.applyAuthResponse(response, this.tokenService.isRememberMeEnabled()),
        ),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );
    }

    return this.refreshInFlight$;
  }

  loadCurrentUser(): Promise<UserProfile> {
    const generation = this.sessionGeneration;
    this.authStore.setLoading(true);

    return firstValueFrom(
      this.authApi.getCurrentUser().pipe(
        tap((user) => {
          if (generation === this.sessionGeneration) {
            this.authStore.setUser(user);
          }
        }),
        finalize(() => this.authStore.setLoading(false)),
      ),
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.authApi.forgotPassword(request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.authApi.resetPassword(request);
  }

  verifyEmail(request: VerifyEmailRequest): Observable<{ message: string }> {
    return this.authApi.verifyEmail(request);
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.authApi.resendVerification({ email });
  }

  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.authApi.changePassword(request);
  }

  updateProfile(request: UpdateUserProfileRequest): Observable<UserProfile> {
    const userId = this.authStore.user()?.id;
    if (!userId) {
      return throwError(() => new Error('No authenticated user.'));
    }

    return this.authApi.updateProfile(userId, request).pipe(
      tap((user) => this.authStore.setUser(user)),
    );
  }

  handleSessionExpired(showMessage = true): void {
    if (this.hasValidSession()) {
      return;
    }

    this.clearSession();
    if (showMessage) {
      this.notifications.error('Your session has expired. Please sign in again.');
    }
    void this.router.navigate(['/session-expired']);
  }

  clearSession(): void {
    this.sessionGeneration++;
    this.tokenService.clearTokens();
    this.authStore.clear();
  }

  private applyAuthResponse(response: AuthResponse, rememberMe: boolean): void {
    this.sessionGeneration++;
    this.tokenService.storeTokens(response, rememberMe);
    this.authStore.setSession(response.accessToken, response.user);
    this.logger.info('Authentication session updated', { userId: response.user.id });
  }
}
