import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';
import { readStorageItem, writeStorageItem } from '@core/utils/storage.util';
import { ThemeStore, type ThemeMode } from '@core/stores/theme.store';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeStore = inject(ThemeStore);
  private readonly config = inject(APP_CONFIG);

  initialize(): void {
    const stored = readThemePreference(this.config.themeStorageKey) ?? 'system';
    this.themeStore.initialize(stored);
    this.applyTheme(this.themeStore.resolvedTheme());

    if (stored === 'system' && typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.themeStore.mode() === 'system') {
          this.applyTheme(this.themeStore.resolvedTheme());
        }
      });
    }
  }

  setMode(mode: ThemeMode): void {
    this.themeStore.setMode(mode);
    writeStorageItem(this.config.themeStorageKey, mode);
    this.applyTheme(this.themeStore.resolvedTheme());
  }

  private applyTheme(resolved: 'light' | 'dark'): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
    document.documentElement.style.colorScheme = resolved;
  }
}

function readThemePreference(storageKey: string): ThemeMode | null {
  const value = readStorageItem(storageKey);
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return null;
}
