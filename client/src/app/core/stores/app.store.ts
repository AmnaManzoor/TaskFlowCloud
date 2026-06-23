import { Injectable, signal } from '@angular/core';

/** Global application state placeholder. */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly _sidebarCollapsed = signal(false);
  private readonly _isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private readonly _isInitialized = signal(false);

  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly isOnline = this._isOnline.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();

  toggleSidebar(): void {
    this._sidebarCollapsed.update((collapsed) => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }

  setOnline(isOnline: boolean): void {
    this._isOnline.set(isOnline);
  }

  markInitialized(): void {
    this._isInitialized.set(true);
  }
}
