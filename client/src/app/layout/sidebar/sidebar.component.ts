import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badgeCount?: number;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatBadgeModule],
  template: `
    <mat-nav-list class="sidebar" aria-label="Main navigation">
      @for (item of navItems(); track item.route) {
        <a
          mat-list-item
          [routerLink]="item.route"
          routerLinkActive="sidebar__link--active"
          [attr.aria-label]="item.label"
        >
          <mat-icon
            matListItemIcon
            aria-hidden="true"
            [matBadge]="item.badgeCount && item.badgeCount > 0 ? item.badgeCount : null"
            matBadgeColor="warn"
            matBadgeSize="small"
          >
            {{ item.icon }}
          </mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: `
    .sidebar {
      padding-top: 0.5rem;
    }

    .sidebar__link--active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      border-radius: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly navItems = input<NavItem[]>([]);
  readonly itemSelected = output<string>();
}
