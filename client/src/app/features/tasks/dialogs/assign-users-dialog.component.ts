import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface AssignUsersDialogData {
  users: { id: string; label: string }[];
  selectedIds: string[];
}

export interface AssignUsersDialogResult {
  userIds: string[];
}

@Component({
  selector: 'app-assign-users-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Assign users</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline" class="dialog-form__field">
          <mat-label>Users</mat-label>
          <mat-select formControlName="userIds" multiple required>
            @for (user of data.users; track user.id) {
              <mat-option [value]="user.id">{{ user.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Assign</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .dialog-form__field {
      width: 100%;
      min-width: min(24rem, 90vw);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignUsersDialogComponent {
  readonly data = inject<AssignUsersDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AssignUsersDialogComponent, AssignUsersDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    userIds: [this.data.selectedIds, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ userIds: this.form.controls.userIds.value });
  }
}
