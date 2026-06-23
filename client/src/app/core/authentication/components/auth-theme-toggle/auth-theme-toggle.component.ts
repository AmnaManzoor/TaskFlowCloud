import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from '@core/services/theme.service';
import type { ThemeMode } from '@core/stores/theme.store';

@Component({
  selector: 'app-auth-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button
      mat-icon-button
      type="button"
      [matMenuTriggerFor]="themeMenu"
      aria-label="Change theme"
      class="auth-theme-toggle"
    >
      <mat-icon aria-hidden="true">palette</mat-icon>
    </button>
    <mat-menu #themeMenu="matMenu">
      @for (option of options; track option.value) {
        <button mat-menu-item type="button" (click)="selectTheme(option.value)">
          <mat-icon aria-hidden="true">{{ option.icon }}</mat-icon>
          <span>{{ option.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: `
    .auth-theme-toggle {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'system', label: 'System', icon: 'settings_brightness' },
  ];

  protected selectTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }
}
