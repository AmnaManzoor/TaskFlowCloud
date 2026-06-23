import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OrganizationMemberRole } from '@features/organizations/models/organization.models';
import { organizationRoleLabel } from '@features/organizations/utils/permissions.util';

export interface AddMemberDialogData {
  title: string;
  users: { id: string; label: string }[];
  showRole: boolean;
}

export interface AddMemberDialogResult {
  userId: string;
  role?: OrganizationMemberRole;
}

@Component({
  selector: 'app-add-member-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
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

        @if (data.showRole) {
          <mat-form-field appearance="outline" class="dialog-form__field">
            <mat-label>Organization role</mat-label>
            <mat-select formControlName="role" required>
              @for (role of roles; track role) {
                <mat-option [value]="role">{{ organizationRoleLabel(role) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Add member</button>
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
export class AddMemberDialogComponent {
  readonly data = inject<AddMemberDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AddMemberDialogComponent, AddMemberDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly organizationRoleLabel = organizationRoleLabel;
  readonly roles = [
    OrganizationMemberRole.Member,
    OrganizationMemberRole.Manager,
    OrganizationMemberRole.Administrator,
  ];

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    role: [OrganizationMemberRole.Member],
  });

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({
      userId: value.userId,
      role: this.data.showRole ? value.role : undefined,
    });
  }
}
