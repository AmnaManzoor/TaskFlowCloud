import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AttachmentApiService } from '@features/collaboration/services/attachment-api.service';
import { fileCategory, isPreviewable } from '@features/collaboration/models/collaboration.utils';
import { AttachmentFileCategory } from '@features/collaboration/models/collaboration.enums';
import type { Attachment } from '@features/collaboration/models/collaboration.models';

export interface AttachmentPreviewDialogData {
  attachment: Attachment;
}

@Component({
  selector: 'app-attachment-preview',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.attachment.originalFileName }}</h2>
    <mat-dialog-content class="attachment-preview">
      @if (loading()) {
        <p>Loading preview...</p>
      } @else if (category() === imageCategory) {
        <img [src]="previewUrl()" [alt]="data.attachment.originalFileName" class="attachment-preview__image" />
      } @else if (category() === pdfCategory) {
        <iframe [src]="previewUrl()" class="attachment-preview__frame" title="PDF preview"></iframe>
      } @else if (textContent()) {
        <pre class="attachment-preview__text">{{ textContent() }}</pre>
      } @else {
        <p>Preview is not available for this file type.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Close</button>
      <a mat-flat-button [href]="previewUrl()" target="_blank" rel="noopener">Download</a>
    </mat-dialog-actions>
  `,
  styles: `
    .attachment-preview {
      min-width: min(48rem, 90vw);
      min-height: 12rem;
    }

    .attachment-preview__image,
    .attachment-preview__frame {
      width: 100%;
      max-height: 70vh;
      border: 0;
      border-radius: 0.5rem;
    }

    .attachment-preview__text {
      max-height: 60vh;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentPreviewComponent {
  readonly data = inject<AttachmentPreviewDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AttachmentPreviewComponent>);
  private readonly attachmentApi = inject(AttachmentApiService);

  readonly loading = signal(true);
  readonly textContent = signal<string | null>(null);
  readonly imageCategory = AttachmentFileCategory.Image;
  readonly pdfCategory = AttachmentFileCategory.Pdf;

  constructor() {
    const category = fileCategory(
      this.data.attachment.fileExtension,
      this.data.attachment.contentType,
    );
    if (
      category === AttachmentFileCategory.Text ||
      category === AttachmentFileCategory.Markdown ||
      category === AttachmentFileCategory.Json
    ) {
      void fetch(this.previewUrl())
        .then((response) => response.text())
        .then((text) => this.textContent.set(text))
        .finally(() => this.loading.set(false));
    } else {
      this.loading.set(false);
    }
  }

  previewUrl() {
    return this.attachmentApi.downloadUrl(this.data.attachment);
  }

  category() {
    return fileCategory(this.data.attachment.fileExtension, this.data.attachment.contentType);
  }
}
