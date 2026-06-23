import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface TransferOwnerDialogData {
  members: { id: string; label: string }[];
}

@Component({
  selector: 'app-transfer-owner-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Transfer ownership</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <p>Select the new project owner. The current owner will be demoted to Manager.</p>
        <mat-form-field appearance="outline" class="dialog-field">
          <mat-label>New owner</mat-label>
          <mat-select formControlName="newOwnerId" required>
            @for (member of data.members; track member.id) {
              <mat-option [value]="member.id">{{ member.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Transfer</button>
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
export class TransferOwnerDialogComponent {
  readonly data = inject<TransferOwnerDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<TransferOwnerDialogComponent, string>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    newOwnerId: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.controls.newOwnerId.value);
  }
}
