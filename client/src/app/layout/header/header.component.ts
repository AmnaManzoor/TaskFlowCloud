import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NotificationIconComponent } from '@layout/notification-icon/notification-icon.component';
import { UserMenuComponent } from '@layout/user-menu/user-menu.component';
import { inject } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationStore } from '@core/stores/notification.store';
import type { ThemeMode } from '@core/stores/theme.store';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NotificationIconComponent,
    UserMenuComponent,
  ],
  template: `
    <mat-toolbar class="header" role="banner">
      <button
        mat-icon-button
        type="button"
        class="header__menu-button"
        (click)="menuToggle.emit()"
        aria-label="Toggle navigation"
      >
        <mat-icon aria-hidden="true">menu</mat-icon>
      </button>

      <span class="header__brand">{{ appName() }}</span>
      <span class="header__spacer"></span>

      <button
        mat-icon-button
        type="button"
        [matMenuTriggerFor]="themeMenu"
        aria-label="Change theme"
      >
        <mat-icon aria-hidden="true">palette</mat-icon>
      </button>
      <mat-menu #themeMenu="matMenu">
        @for (option of themeOptions; track option.value) {
          <button mat-menu-item type="button" (click)="selectTheme(option.value)">
            <mat-icon aria-hidden="true">{{ option.icon }}</mat-icon>
            <span>{{ option.label }}</span>
          </button>
        }
      </mat-menu>

      <app-notification-icon
        [unreadCount]="notificationStore.unreadCount()"
        (openNotifications)="openNotifications.emit()"
      />
      <app-user-menu
        [userName]="userName()"
        (profileClick)="profileClick.emit()"
        (settingsClick)="settingsClick.emit()"
        (logoutClick)="logoutClick.emit()"
      />
    </mat-toolbar>
  `,
  styles: `
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 0.5rem;
    }

    .header__brand {
      font: var(--mat-sys-title-large);
    }

    .header__spacer {
      flex: 1 1 auto;
    }

    @media (min-width: 960px) {
      .header__menu-button {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);
  readonly notificationStore = inject(NotificationStore);

  readonly appName = input('TaskFlow');
  readonly userName = input('TaskFlow User');

  readonly menuToggle = output<void>();
  readonly openNotifications = output<void>();
  readonly profileClick = output<void>();
  readonly settingsClick = output<void>();
  readonly logoutClick = output<void>();

  protected readonly themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'system', label: 'System', icon: 'settings_brightness' },
  ];

  protected selectTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }
}
