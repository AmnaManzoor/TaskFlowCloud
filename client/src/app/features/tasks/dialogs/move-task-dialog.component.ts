import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface MoveTaskDialogData {
  projects: { id: string; name: string }[];
  currentProjectId: string;
}

export interface MoveTaskDialogResult {
  targetProjectId: string;
}

@Component({
  selector: 'app-move-task-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Move task</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="dialog-form__field">
          <mat-label>Target project</mat-label>
          <mat-select formControlName="targetProjectId" required>
            @for (project of data.projects; track project.id) {
              <mat-option [value]="project.id" [disabled]="project.id === data.currentProjectId">
                {{ project.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid">Move</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.dialog-form__field { width: 100%; min-width: min(24rem, 90vw); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveTaskDialogComponent {
  readonly data = inject<MoveTaskDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MoveTaskDialogComponent, MoveTaskDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    targetProjectId: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ targetProjectId: this.form.controls.targetProjectId.value });
  }
}
