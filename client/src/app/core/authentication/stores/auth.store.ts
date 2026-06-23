import { computed, Injectable, signal } from '@angular/core';
import type { UserProfile } from '@core/authentication/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = signal<UserProfile | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => !!this._accessToken());
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly permissions = computed(() => derivePermissions(this.roles()));

  setSession(accessToken: string, user: UserProfile): void {
    this._accessToken.set(accessToken);
    this._user.set(user);
    this._error.set(null);
  }

  setUser(user: UserProfile): void {
    this._user.set(user);
  }

  setAccessToken(accessToken: string | null): void {
    this._accessToken.set(accessToken);
  }

  setLoading(isLoading: boolean): void {
    this._isLoading.set(isLoading);
  }

  setError(message: string | null): void {
    this._error.set(message);
  }

  clear(): void {
    this._user.set(null);
    this._accessToken.set(null);
    this._error.set(null);
    this._isLoading.set(false);
  }

  hasRole(role: string): boolean {
    return this.roles().some((current) => current.toLowerCase() === role.toLowerCase());
  }

  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }
}

function derivePermissions(roles: readonly string[]): string[] {
  const permissions = new Set<string>(['profile:read']);

  for (const role of roles) {
    const normalized = role.toLowerCase();
    if (normalized === 'superadmin' || normalized === 'admin') {
      permissions.add('users:manage');
      permissions.add('organizations:manage');
    }
    if (normalized === 'manager' || normalized === 'superadmin' || normalized === 'admin') {
      permissions.add('projects:manage');
    }
  }

  return [...permissions];
}
