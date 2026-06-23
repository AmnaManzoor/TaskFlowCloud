import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification-badge',
  imports: [MatBadgeModule, MatIconModule],
  template: `
    <span
      class="notification-badge"
      [matBadge]="badgeValue()"
      matBadgeColor="warn"
      matBadgeSize="small"
      [matBadgeHidden]="unreadCount() === 0"
      [attr.aria-label]="ariaLabel()"
    >
      <ng-content />
    </span>
  `,
  styles: `
    .notification-badge {
      display: inline-flex;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBadgeComponent {
  readonly unreadCount = input(0);
  readonly maxDisplay = input(99);

  protected badgeValue(): string | null {
    const count = this.unreadCount();
    if (count <= 0) return null;
    return count > this.maxDisplay() ? `${this.maxDisplay()}+` : `${count}`;
  }

  protected ariaLabel(): string {
    const count = this.unreadCount();
    return count === 0 ? 'No unread notifications' : `${count} unread notifications`;
  }
}
