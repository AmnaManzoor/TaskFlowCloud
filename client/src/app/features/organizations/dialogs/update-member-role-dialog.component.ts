import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';
import { organizationRoleLabel } from '@features/organizations/utils/permissions.util';
import type { OrganizationMember } from '@features/organizations/models/organization.models';

export interface UpdateMemberRoleDialogData {
  member: OrganizationMember;
}

@Component({
  selector: 'app-update-member-role-dialog',
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
              <mat-option [value]="role">{{ organizationRoleLabel(role) }}</mat-option>
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
  styles: `
    .dialog-field {
      width: 100%;
      min-width: 16rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateMemberRoleDialogComponent {
  readonly data = inject<UpdateMemberRoleDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UpdateMemberRoleDialogComponent, OrganizationMemberRole>);
  private readonly fb = inject(FormBuilder);

  readonly organizationRoleLabel = organizationRoleLabel;
  readonly roles = [
    OrganizationMemberRole.Member,
    OrganizationMemberRole.Manager,
    OrganizationMemberRole.Administrator,
  ];

  readonly form = this.fb.nonNullable.group({
    role: [this.data.member.role, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.controls.role.value);
  }
}
