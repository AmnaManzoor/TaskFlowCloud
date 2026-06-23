import { computed, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _mode = signal<ThemeMode>('system');

  readonly mode = this._mode.asReadonly();
  readonly resolvedTheme = computed(() => {
    const mode = this._mode();
    if (mode !== 'system') {
      return mode;
    }

    return this.getSystemTheme();
  });

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  initialize(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
