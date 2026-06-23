import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { APP_CONFIG } from '@core/config/app-config.token';
import { AuthBrandPanelComponent } from '@core/authentication/components/auth-brand-panel/auth-brand-panel.component';
import { AuthThemeToggleComponent } from '@core/authentication/components/auth-theme-toggle/auth-theme-toggle.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, MatIconModule, AuthBrandPanelComponent, AuthThemeToggleComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-shell__brand">
        <app-auth-brand-panel [appName]="config.appName" />
      </div>

      <div class="auth-shell__main">
        <div class="auth-shell__toolbar">
          <div class="auth-shell__mobile-logo">
            <mat-icon aria-hidden="true">task_alt</mat-icon>
            <span>{{ config.appName }}</span>
          </div>
          <app-auth-theme-toggle />
        </div>

        <div class="auth-shell__content">
          <div class="auth-shell__inner">
            <router-outlet />
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  readonly config = inject(APP_CONFIG);
}
