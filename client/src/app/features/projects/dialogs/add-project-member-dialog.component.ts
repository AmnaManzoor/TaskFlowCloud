import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProjectRole } from '@features/projects/models/project.enums';
import { projectRoleLabel } from '@features/projects/models/project.utils';

export interface AddProjectMemberDialogData {
  users: { id: string; label: string }[];
}

export interface AddProjectMemberDialogResult {
  userId: string;
  role: ProjectRole;
}

@Component({
  selector: 'app-add-project-member-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Add project member</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline" class="dialog-form__field">
          <mat-label>User</mat-label>
          <mat-select formControlName="userId" required>
            @for (user of data.users; track user.id) {
              <mat-option [value]="user.id">{{ user.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="dialog-form__field">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            @for (role of roles; track role) {
              <mat-option [value]="role">{{ projectRoleLabel(role) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Add</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: min(24rem, 90vw);
    }

    .dialog-form__field {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProjectMemberDialogComponent {
  readonly data = inject<AddProjectMemberDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AddProjectMemberDialogComponent, AddProjectMemberDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly projectRoleLabel = projectRoleLabel;
  readonly roles = [ProjectRole.Viewer, ProjectRole.Contributor, ProjectRole.Manager];

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    role: [ProjectRole.Contributor, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
