import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  POLLING_INTERVAL_MAX_MS,
  POLLING_INTERVAL_MIN_MS,
  type NotificationSettings,
} from '@features/notifications/models/notification.models';
import { NotificationsService } from '@features/notifications/services/notification.service';

export interface NotificationSettingsDialogData {
  settings: NotificationSettings;
}

@Component({
  selector: 'app-notification-settings-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Notification settings</h2>
    <form mat-dialog-content class="settings-form" [formGroup]="form" (ngSubmit)="save()">
      <mat-slide-toggle formControlName="pollingEnabled">Background polling</mat-slide-toggle>
      <mat-form-field appearance="outline">
        <mat-label>Polling interval</mat-label>
        <mat-select formControlName="pollingIntervalMs">
          <mat-option [value]="30000">30 seconds</mat-option>
          <mat-option [value]="45000">45 seconds</mat-option>
          <mat-option [value]="60000">60 seconds</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-slide-toggle formControlName="showReadInDrawer">Show read items in drawer</mat-slide-toggle>
      <p class="settings-form__note">
        Real-time delivery via SignalR can replace polling in a future release without changing the UI.
      </p>
    </form>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: min(24rem, 100%);
    }

    .settings-form__note {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notificationsService = inject(NotificationsService);
  readonly data = inject<NotificationSettingsDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<NotificationSettingsDialogComponent, NotificationSettings | undefined>);

  readonly form = this.fb.nonNullable.group({
    pollingEnabled: this.data.settings.pollingEnabled,
    pollingIntervalMs: this.clamp(this.data.settings.pollingIntervalMs),
    showReadInDrawer: this.data.settings.showReadInDrawer,
  });

  save(): void {
    const value = this.form.getRawValue();
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      pollingEnabled: value.pollingEnabled,
      pollingIntervalMs: this.clamp(value.pollingIntervalMs),
      showReadInDrawer: value.showReadInDrawer,
    };
    this.notificationsService.updateSettings(settings);
    this.dialogRef.close(settings);
  }

  private clamp(value: number): number {
    return Math.min(POLLING_INTERVAL_MAX_MS, Math.max(POLLING_INTERVAL_MIN_MS, value));
  }
}
