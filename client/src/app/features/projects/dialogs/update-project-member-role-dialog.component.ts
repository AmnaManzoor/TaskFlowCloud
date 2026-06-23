import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProjectRole } from '@features/projects/models/project.enums';
import { projectRoleLabel } from '@features/projects/models/project.utils';
import type { ProjectMember } from '@features/projects/models/project.models';

@Component({
  selector: 'app-update-project-member-role-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Change member role</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <p>{{ data.member.firstName }} {{ data.member.lastName }}</p>
        <mat-form-field appearance="outline" class="dialog-field">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role) {
              <mat-option [value]="role">{{ projectRoleLabel(role) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProjectMemberRoleDialogComponent {
  readonly data = inject<{ member: ProjectMember }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UpdateProjectMemberRoleDialogComponent, ProjectRole>);
  private readonly fb = inject(FormBuilder);

  readonly projectRoleLabel = projectRoleLabel;
  readonly roles = [ProjectRole.Viewer, ProjectRole.Contributor, ProjectRole.Manager];

  readonly form = this.fb.nonNullable.group({
    role: [this.data.member.role, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.controls.role.value);
  }
}
