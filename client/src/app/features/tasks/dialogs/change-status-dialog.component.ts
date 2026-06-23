import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TaskStatus } from '@features/tasks/models/task.enums';
import { taskStatusLabel } from '@features/tasks/models/task.utils';

export interface ChangeStatusDialogData {
  currentStatus: TaskStatus;
}

export interface ChangeStatusDialogResult {
  status: TaskStatus;
}

@Component({
  selector: 'app-change-status-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Change status</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="dialog-form__field">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status" required>
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ taskStatusLabel(status) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Update</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.dialog-form__field { width: 100%; min-width: min(20rem, 90vw); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusDialogComponent {
  readonly data = inject<ChangeStatusDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ChangeStatusDialogComponent, ChangeStatusDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly taskStatusLabel = taskStatusLabel;
  readonly statuses = [
    TaskStatus.Backlog,
    TaskStatus.Todo,
    TaskStatus.InProgress,
    TaskStatus.InReview,
    TaskStatus.Blocked,
    TaskStatus.Completed,
    TaskStatus.Cancelled,
  ];

  readonly form = this.fb.nonNullable.group({
    status: [this.data.currentStatus, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ status: this.form.controls.status.value });
  }
}
