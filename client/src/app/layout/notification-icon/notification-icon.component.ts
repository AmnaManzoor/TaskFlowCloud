import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationBadgeComponent } from '@features/notifications/components/notification-badge/notification-badge.component';

@Component({
  selector: 'app-notification-icon',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, NotificationBadgeComponent],
  template: `
    <button
      mat-icon-button
      type="button"
      matTooltip="Notifications"
      [attr.aria-label]="ariaLabel()"
      (click)="openNotifications.emit()"
    >
      <app-notification-badge [unreadCount]="unreadCount()">
        <mat-icon aria-hidden="true">notifications</mat-icon>
      </app-notification-badge>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationIconComponent {
  readonly unreadCount = input(0);
  readonly openNotifications = output<void>();

  protected ariaLabel(): string {
    const count = this.unreadCount();
    return count > 0 ? `Notifications, ${count} unread` : 'Notifications';
  }
}
