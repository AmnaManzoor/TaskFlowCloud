import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, UserAvatarComponent],
  template: `
    <button
      mat-icon-button
      type="button"
      [matMenuTriggerFor]="menu"
      aria-label="User menu"
    >
      <app-user-avatar [name]="userName()" [size]="32" />
    </button>

    <mat-menu #menu="matMenu">
      <button mat-menu-item type="button" disabled>
        <mat-icon aria-hidden="true">person</mat-icon>
        <span>{{ userName() }}</span>
      </button>
      <button mat-menu-item type="button" (click)="profileClick.emit()">
        <mat-icon aria-hidden="true">account_circle</mat-icon>
        <span>Profile</span>
      </button>
      <button mat-menu-item type="button" (click)="settingsClick.emit()">
        <mat-icon aria-hidden="true">settings</mat-icon>
        <span>Settings</span>
      </button>
      <button mat-menu-item type="button" (click)="logoutClick.emit()">
        <mat-icon aria-hidden="true">logout</mat-icon>
        <span>Sign out</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly userName = input('TaskFlow User');

  readonly profileClick = output<void>();
  readonly settingsClick = output<void>();
  readonly logoutClick = output<void>();
}
