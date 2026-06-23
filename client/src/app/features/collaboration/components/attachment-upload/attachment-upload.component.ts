import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-attachment-upload',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div
      class="attachment-upload"
      [class.attachment-upload--active]="dragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
      role="region"
      aria-label="Upload attachments"
    >
      <mat-icon aria-hidden="true">cloud_upload</mat-icon>
      <p>Drag & drop files here, or</p>
      <button mat-stroked-button type="button" (click)="input.click()">Choose files</button>
      <input #input class="attachment-upload__input" type="file" multiple (change)="onFileChange($event)" />
    </div>
  `,
  styles: `
    .attachment-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.25rem;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-low);
      text-align: center;
      transition: border-color 180ms ease, background 180ms ease;
    }

    .attachment-upload--active {
      border-color: var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
    }

    .attachment-upload__input {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentUploadComponent {
  readonly filesSelected = output<File[]>();
  readonly dragActive = signal(false);

  dragOver() {
    return this.dragActive();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(): void {
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length) {
      this.filesSelected.emit(files);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    if (files.length) {
      this.filesSelected.emit(files);
    }
    input.value = '';
  }
}
