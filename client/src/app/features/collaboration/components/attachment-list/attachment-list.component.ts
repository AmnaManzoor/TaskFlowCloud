import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { AttachmentCardComponent } from '@features/collaboration/components/attachment-card/attachment-card.component';
import { AttachmentUploadComponent } from '@features/collaboration/components/attachment-upload/attachment-upload.component';
import { AttachmentStore } from '@features/collaboration/stores/attachment.store';
import type { Attachment } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-attachment-list',
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    AttachmentCardComponent,
    AttachmentUploadComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="attachment-list">
      @if (canUpload()) {
        <app-attachment-upload (filesSelected)="store.uploadFiles($event)" />
      }

      @for (upload of uploadEntries(); track upload[0]) {
        <div class="attachment-list__progress">
          <span>{{ upload[1].fileName }}</span>
          @if (upload[1].status === 'uploading') {
            <mat-progress-bar mode="determinate" [value]="upload[1].progress" />
            <button mat-button type="button" (click)="store.cancelUpload(upload[0])">Cancel</button>
          } @else if (upload[1].status === 'error') {
            <span class="attachment-list__error">{{ upload[1].error }}</span>
          }
        </div>
      }

      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="store.loadAttachments()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="3" />
      } @else if (store.items().length === 0) {
        <app-empty-state
          icon="attach_file"
          title="No attachments"
          description="Drag and drop files here or click to upload."
        />
      } @else {
        <div class="attachment-list__items">
          @for (attachment of store.items(); track attachment.id) {
            <app-attachment-card
              [attachment]="attachment"
              [canManage]="canManage(attachment)"
              (preview)="preview.emit($event)"
              (download)="onDownload($event)"
              (copyLink)="onCopyLink($event)"
              (replace)="replaceRequest.emit($event)"
              (delete)="deleteRequest.emit(attachment)"
            />
          }
        </div>

        @if (store.hasMore()) {
          <button mat-stroked-button type="button" (click)="store.loadMore()">Load more</button>
        }
      }
    </div>
  `,
  styles: `
    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .attachment-list__items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .attachment-list__progress {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.5rem 0;
    }

    .attachment-list__error {
      color: var(--mat-sys-error);
      font: var(--mat-sys-label-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentListComponent implements OnInit {
  readonly taskId = input.required<string>();
  readonly currentUserId = input<string | null>(null);
  readonly canUpload = input(true);
  readonly preview = output<Attachment>();
  readonly replaceRequest = output<Attachment>();
  readonly deleteRequest = output<Attachment>();

  readonly store = inject(AttachmentStore);

  ngOnInit(): void {
    this.store.loadForTask(this.taskId());
  }

  uploadEntries() {
    return Object.entries(this.store.uploads());
  }

  canManage(attachment: Attachment) {
    return this.currentUserId() === attachment.uploadedBy;
  }

  onDownload(attachment: Attachment): void {
    window.open(this.store.downloadUrl(attachment), '_blank', 'noopener');
  }

  onCopyLink(attachment: Attachment): void {
    void navigator.clipboard.writeText(this.store.downloadUrl(attachment));
  }
}
