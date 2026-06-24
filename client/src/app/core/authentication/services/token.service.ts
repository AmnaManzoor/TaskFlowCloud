import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';
import { readStorageItem, removeStorageItem, writeStorageItem } from '@core/utils/storage.util';
import type { AuthResponse, StoredTokens } from '@core/authentication/models/auth.models';

const REFRESH_BUFFER_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly config = inject(APP_CONFIG);
  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private onRefreshCallback: (() => void) | null = null;

  getAccessToken(): string | null {
    return this.readStoredValue(this.config.tokenStorageKey);
  }

  getRefreshToken(): string | null {
    return this.readStoredValue(this.config.refreshTokenStorageKey);
  }

  getAccessTokenExpiresAt(): Date | null {
    const raw = this.readStoredValue(this.config.accessTokenExpiresAtStorageKey);
    if (!raw) {
      return null;
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  isRememberMeEnabled(): boolean {
    return this.readStoredValue(this.config.rememberMeStorageKey) === 'true';
  }

  hasStoredSession(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  isAccessTokenExpired(leewayMs = 0): boolean {
    const expiresAt = this.getAccessTokenExpiresAt();
    if (!expiresAt) {
      return true;
    }

    return expiresAt.getTime() <= Date.now() + leewayMs;
  }

  isAccessTokenExpiringSoon(): boolean {
    return this.isAccessTokenExpired(REFRESH_BUFFER_MS);
  }

  storeTokens(response: AuthResponse, rememberMe: boolean): void {
    const storage = this.resolveStorage(rememberMe);
    this.writeToStorage(storage, this.config.tokenStorageKey, response.accessToken);
    this.writeToStorage(storage, this.config.refreshTokenStorageKey, response.refreshToken);
    this.writeToStorage(
      storage,
      this.config.accessTokenExpiresAtStorageKey,
      response.accessTokenExpiresAt,
    );
    this.writeToStorage(storage, this.config.rememberMeStorageKey, String(rememberMe));

    this.clearOppositeStorage(rememberMe);
    this.scheduleRefresh(response.accessTokenExpiresAt);
  }

  clearTokens(): void {
    this.clearRefreshTimer();
    removeStorageItem(this.config.tokenStorageKey);
    removeStorageItem(this.config.refreshTokenStorageKey);
    removeStorageItem(this.config.accessTokenExpiresAtStorageKey);
    removeStorageItem(this.config.rememberMeStorageKey);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.config.tokenStorageKey);
      sessionStorage.removeItem(this.config.refreshTokenStorageKey);
      sessionStorage.removeItem(this.config.accessTokenExpiresAtStorageKey);
      sessionStorage.removeItem(this.config.rememberMeStorageKey);
    }
  }

  registerRefreshCallback(callback: () => void): void {
    this.onRefreshCallback = callback;
    const expiresAt = this.getAccessTokenExpiresAt();
    if (expiresAt) {
      this.scheduleRefresh(expiresAt.toISOString());
    }
  }

  private scheduleRefresh(accessTokenExpiresAt: string): void {
    this.clearRefreshTimer();

    const expiresAtMs = new Date(accessTokenExpiresAt).getTime();
    const delay = Math.max(expiresAtMs - Date.now() - REFRESH_BUFFER_MS, 0);

    this.refreshTimerId = setTimeout(() => {
      this.onRefreshCallback?.();
    }, delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  private resolveStorage(rememberMe: boolean): Storage {
    if (typeof localStorage === 'undefined') {
      throw new Error('Browser storage is unavailable.');
    }

    return rememberMe ? localStorage : sessionStorage;
  }

  private writeToStorage(storage: Storage, key: string, value: string): void {
    try {
      storage.setItem(key, value);
    } catch {
      writeStorageItem(key, value);
    }
  }

  private clearOppositeStorage(rememberMe: boolean): void {
    const opposite = rememberMe ? sessionStorage : localStorage;
    if (typeof opposite === 'undefined') {
      return;
    }

    opposite.removeItem(this.config.tokenStorageKey);
    opposite.removeItem(this.config.refreshTokenStorageKey);
    opposite.removeItem(this.config.accessTokenExpiresAtStorageKey);
    opposite.removeItem(this.config.rememberMeStorageKey);
  }

  private readStoredValue(key: string): string | null {
    if (typeof sessionStorage !== 'undefined') {
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) {
        return sessionValue;
      }
    }

    return readStorageItem(key);
  }
}
