import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FileIconComponent } from '@features/collaboration/components/file-icon/file-icon.component';
import { formatFileSize, fileCategory } from '@features/collaboration/models/collaboration.utils';
import type { Attachment } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-attachment-card',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule, FileIconComponent],
  template: `
    <article class="attachment-card">
      <div class="attachment-card__icon" aria-hidden="true">
        <app-file-icon [extension]="attachment().fileExtension" [contentType]="attachment().contentType" />
      </div>
      <div class="attachment-card__meta">
        <h4>{{ attachment().originalFileName }}</h4>
        <p>{{ formatSize(attachment().fileSize) }} · {{ attachment().createdAt | date: 'medium' }}</p>
        <p class="attachment-card__uploader">{{ attachment().uploaderEmail }}</p>
      </div>
      <div class="attachment-card__actions">
        <button mat-icon-button type="button" aria-label="Preview" (click)="preview.emit(attachment())">
          <mat-icon>visibility</mat-icon>
        </button>
        <button mat-icon-button type="button" aria-label="Download" (click)="download.emit(attachment())">
          <mat-icon>download</mat-icon>
        </button>
        <button mat-icon-button type="button" [matMenuTriggerFor]="menu" aria-label="Attachment actions">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button" (click)="copyLink.emit(attachment())">Copy link</button>
          @if (canManage()) {
            <button mat-menu-item type="button" (click)="replace.emit(attachment())">Replace file</button>
            <button mat-menu-item type="button" (click)="delete.emit(attachment().id)">Delete</button>
          }
        </mat-menu>
      </div>
    </article>
  `,
  styles: `
    .attachment-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: box-shadow 180ms ease;
    }

    .attachment-card:hover {
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    .attachment-card__icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-high);
    }

    .attachment-card__meta h4 {
      margin: 0 0 0.25rem;
      font: var(--mat-sys-title-small);
      word-break: break-word;
    }

    .attachment-card__meta p {
      margin: 0;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .attachment-card__actions {
      display: flex;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentCardComponent {
  readonly attachment = input.required<Attachment>();
  readonly canManage = input(false);
  readonly preview = output<Attachment>();
  readonly download = output<Attachment>();
  readonly copyLink = output<Attachment>();
  readonly replace = output<Attachment>();
  readonly delete = output<string>();

  formatSize(bytes: number) {
    return formatFileSize(bytes);
  }

  category() {
    const attachment = this.attachment();
    return fileCategory(attachment.fileExtension, attachment.contentType);
  }
}
