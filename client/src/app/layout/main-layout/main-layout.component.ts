import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '@layout/header/header.component';
import { SidebarComponent, type NavItem } from '@layout/sidebar/sidebar.component';
import { FooterComponent } from '@layout/footer/footer.component';
import { AuthService } from '@core/authentication/services/auth.service';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { AppStore } from '@core/stores/app.store';
import { NotificationStore } from '@core/stores/notification.store';
import { LoadingService } from '@core/services/loading.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { APP_CONFIG } from '@core/config/app-config.token';
import { NotificationDrawerComponent } from '@features/notifications/components/notification-drawer/notification-drawer.component';
import { NotificationsService } from '@features/notifications/services/notification.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LoadingSpinnerComponent,
    NotificationDrawerComponent,
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav
        #drawer
        class="layout__sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
      >
        <app-sidebar [navItems]="navItems()" />
      </mat-sidenav>

      <mat-sidenav-content class="layout__content">
        <app-header
          [appName]="config.appName"
          [userName]="userName()"
          (menuToggle)="toggleDrawer(drawer)"
          (profileClick)="navigate('/profile')"
          (settingsClick)="navigate('/settings')"
          (logoutClick)="onLogout()"
          (openNotifications)="openNotificationDrawer()"
        />

        <main class="layout__main" id="main-content" tabindex="-1">
          <router-outlet />
        </main>

        <app-footer [appName]="config.appName" />
      </mat-sidenav-content>
    </mat-sidenav-container>

    @if (loadingService.isLoading()) {
      <app-loading-spinner [overlay]="true" label="Loading..." />
    }

    <app-notification-drawer
      [opened]="notificationDrawerOpen()"
      (openedChange)="notificationDrawerOpen.set($event)"
      (notificationSelected)="onNotificationSelected($event)"
    />
  `,
  styles: `
    .layout {
      min-height: 100vh;
    }

    .layout__sidenav {
      width: 16.5rem;
      padding: 0.5rem;
      border-right: 1px solid var(--mat-sys-outline-variant);
    }

    .layout__content {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout__main {
      flex: 1 1 auto;
      padding: 1.5rem;
      outline: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);

  readonly appStore = inject(AppStore);
  readonly authStore = inject(AuthStore);
  readonly authService = inject(AuthService);
  readonly loadingService = inject(LoadingService);
  readonly notificationStore = inject(NotificationStore);
  readonly config = inject(APP_CONFIG);

  protected readonly notificationDrawerOpen = signal(false);

  protected readonly userName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.firstName} ${user.lastName}` : 'TaskFlow User';
  });

  readonly isHandset = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly navItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'Notifications',
      icon: 'notifications',
      route: '/notifications',
      badgeCount: this.notificationStore.unreadCount(),
    },
    { label: 'Projects', icon: 'folder', route: '/projects' },
    { label: 'Reports', icon: 'analytics', route: '/reports/dashboard' },
    { label: 'Tasks', icon: 'task_alt', route: '/tasks' },
    { label: 'Organizations', icon: 'business', route: '/organizations' },
    { label: 'Users', icon: 'group', route: '/users' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ]);

  ngOnInit(): void {
    this.notificationsService.startPolling();
    this.notificationsService.refreshUnreadCount();
    this.notificationStore.loadDrawerPreview();
  }

  protected openNotificationDrawer(): void {
    this.notificationDrawerOpen.set(true);
    this.notificationStore.loadDrawerPreview();
    this.notificationsService.refreshUnreadCount();
  }

  protected onNotificationSelected(notification: { id: string }): void {
    void this.router.navigate(['/notifications', notification.id]);
  }

  protected toggleDrawer(drawer: { toggle: () => void }): void {
    drawer.toggle();
  }

  protected navigate(route: string): void {
    void this.router.navigate([route]);
  }

  protected onLogout(): void {
    this.authService.logout().subscribe();
  }
}
