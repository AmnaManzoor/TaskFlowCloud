import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RenameFileDialogData {
  fileName: string;
}

export interface RenameFileDialogResult {
  file: File;
}

@Component({
  selector: 'app-rename-file-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Replace file</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <p>Upload a replacement file. The server uses the uploaded file name.</p>
        <input type="file" (change)="onFileChange($event)" required />
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="!selectedFile">Replace</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.dialog-form { display: flex; flex-direction: column; gap: 0.75rem; min-width: min(24rem, 90vw); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameFileDialogComponent {
  readonly data = inject<RenameFileDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RenameFileDialogComponent, RenameFileDialogResult>);
  private readonly fb = inject(FormBuilder);

  selectedFile: File | null = null;
  readonly form = this.fb.group({});

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submit(): void {
    if (!this.selectedFile) return;
    this.dialogRef.close({ file: this.selectedFile });
  }
}
