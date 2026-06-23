import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '@core/stores/auth.store';
import { UserStore } from '@features/organizations/stores/user.store';
import { ActivityPanelComponent } from '@features/collaboration/components/activity-panel/activity-panel.component';
import { AttachmentListComponent } from '@features/collaboration/components/attachment-list/attachment-list.component';
import { AttachmentPreviewComponent } from '@features/collaboration/components/attachment-preview/attachment-preview.component';
import { CommentListComponent } from '@features/collaboration/components/comment-list/comment-list.component';
import {
  DeleteCommentDialogComponent,
  type DeleteCommentDialogData,
} from '@features/collaboration/dialogs/delete-comment-dialog.component';
import {
  DeleteFileDialogComponent,
  type DeleteFileDialogData,
} from '@features/collaboration/dialogs/delete-file-dialog.component';
import {
  RenameFileDialogComponent,
  type RenameFileDialogResult,
} from '@features/collaboration/dialogs/rename-file-dialog.component';
import { AttachmentStore } from '@features/collaboration/stores/attachment.store';
import { CommentStore } from '@features/collaboration/stores/comment.store';
import type { Attachment } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-task-collaboration-panel',
  imports: [MatTabsModule, CommentListComponent, AttachmentListComponent, ActivityPanelComponent],
  template: `
    <mat-tab-group class="collaboration-panel" dynamicHeight>
      <mat-tab label="Comments">
        <app-comment-list
          [taskId]="taskId()"
          [currentUserId]="currentUserId()"
          [canComment]="canComment()"
          [mentionUsers]="mentionUsers()"
          (deleteRequest)="confirmDeleteComment($event)"
        />
      </mat-tab>
      <mat-tab label="Attachments">
        <app-attachment-list
          [taskId]="taskId()"
          [currentUserId]="currentUserId()"
          [canUpload]="canComment()"
          (preview)="openPreview($event)"
          (replaceRequest)="replaceAttachment($event)"
          (deleteRequest)="confirmDeleteAttachment($event)"
        />
      </mat-tab>
      <mat-tab label="Activity">
        <app-activity-panel [taskId]="taskId()" />
      </mat-tab>
    </mat-tab-group>
  `,
  styles: `
    .collaboration-panel {
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCollaborationPanelComponent implements OnDestroy {
  readonly taskId = input.required<string>();
  readonly canComment = input(true);

  readonly authStore = inject(AuthStore);
  readonly userStore = inject(UserStore);
  readonly commentStore = inject(CommentStore);
  readonly attachmentStore = inject(AttachmentStore);
  readonly dialog = inject(MatDialog);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);

  readonly mentionUsers = computed(() =>
    this.userStore.items().map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
    })),
  );

  constructor() {
    this.userStore.loadList();
  }

  ngOnDestroy(): void {
    this.commentStore.clear();
    this.attachmentStore.clear();
  }

  confirmDeleteComment(commentId: string): void {
    const comment = this.commentStore.items().find((item) => item.id === commentId);
    this.dialog
      .open<DeleteCommentDialogComponent, DeleteCommentDialogData, boolean>(DeleteCommentDialogComponent, {
        data: { preview: comment?.content.slice(0, 120) ?? 'Comment' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.commentStore.delete(commentId);
        }
      });
  }

  openPreview(attachment: Attachment): void {
    this.dialog.open(AttachmentPreviewComponent, {
      data: { attachment },
      maxWidth: '95vw',
    });
  }

  confirmDeleteAttachment(attachment: Attachment): void {
    this.dialog
      .open<DeleteFileDialogComponent, DeleteFileDialogData, boolean>(DeleteFileDialogComponent, {
        data: { fileName: attachment.originalFileName },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.attachmentStore.delete(attachment.id);
        }
      });
  }

  replaceAttachment(attachment: Attachment): void {
    this.dialog
      .open<RenameFileDialogComponent, unknown, RenameFileDialogResult>(RenameFileDialogComponent, {
        data: { fileName: attachment.originalFileName },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.attachmentStore.replace(attachment.id, result.file);
        }
      });
  }
}
