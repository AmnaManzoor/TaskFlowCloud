import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { REPORT_NAV_ITEMS } from '@features/reports/models/report-nav';

@Component({
  selector: 'app-reports-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <div class="reports-shell">
      <nav class="reports-shell__nav" aria-label="Reports navigation">
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="reports-shell__link--active"
              [attr.aria-label]="item.label"
            >
              <mat-icon matListItemIcon aria-hidden="true">{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </nav>
      <div class="reports-shell__content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .reports-shell {
      display: grid;
      grid-template-columns: minmax(12rem, 15rem) minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }
    .reports-shell__nav {
      position: sticky;
      top: 5rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.875rem;
      background: var(--mat-sys-surface-container-lowest);
    }
    .reports-shell__link--active {
      background: var(--mat-sys-secondary-container);
      border-radius: 0.75rem;
    }
    @media (max-width: 960px) {
      .reports-shell { grid-template-columns: 1fr; }
      .reports-shell__nav { position: static; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsShellComponent {
  readonly navItems = REPORT_NAV_ITEMS;
}
