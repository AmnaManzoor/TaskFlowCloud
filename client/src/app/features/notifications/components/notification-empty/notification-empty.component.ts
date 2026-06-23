import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification-empty',
  imports: [MatIconModule],
  template: `
    <div class="notification-empty" role="status">
      <mat-icon class="notification-empty__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <h3 class="notification-empty__title">{{ title() }}</h3>
      <p class="notification-empty__description">{{ description() }}</p>
    </div>
  `,
  styles: `
    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2.5rem 1rem;
      text-align: center;
    }

    .notification-empty__icon {
      width: 3rem;
      height: 3rem;
      font-size: 3rem;
      color: var(--mat-sys-primary);
      opacity: 0.8;
    }

    .notification-empty__title {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .notification-empty__description {
      margin: 0;
      max-width: 24rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationEmptyComponent {
  readonly icon = input('notifications_none');
  readonly title = input('No notifications');
  readonly description = input('You are all caught up.');
}
