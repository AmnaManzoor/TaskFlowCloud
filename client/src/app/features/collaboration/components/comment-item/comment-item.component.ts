import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { MentionChipComponent } from '@features/collaboration/components/mention-dropdown/mention-chip.component';
import {
  authorDisplayName,
  mentionDisplayName,
  renderMarkdownPreview,
} from '@features/collaboration/models/collaboration.utils';
import type { Comment } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-comment-actions',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="comment-actions">
      @if (canReply()) {
        <button mat-button type="button" (click)="reply.emit()">Reply</button>
      }
      @if (canEdit()) {
        <button mat-button type="button" (click)="edit.emit()">Edit</button>
      }
      @if (canDelete()) {
        <button mat-button type="button" color="warn" (click)="delete.emit()">Delete</button>
      }
      @if (hasReplies()) {
        <button mat-button type="button" (click)="toggleThread.emit()">
          {{ collapsed() ? 'Expand' : 'Collapse' }} ({{ replyCount() }})
        </button>
      }
    </div>
  `,
  styles: `
    .comment-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentActionsComponent {
  readonly canReply = input(true);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly hasReplies = input(false);
  readonly replyCount = input(0);
  readonly collapsed = input(false);
  readonly reply = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly toggleThread = output<void>();
}

@Component({
  selector: 'app-comment-item',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    UserAvatarComponent,
    MentionChipComponent,
    CommentActionsComponent,
  ],
  template: `
    <article class="comment-item" [class.comment-item--deleted]="comment().isDeleted">
      <app-user-avatar [name]="authorName()" [size]="32" />
      <div class="comment-item__body">
        <header class="comment-item__header">
          <strong>{{ authorName() }}</strong>
          <time [dateTime]="comment().createdAt">{{ comment().createdAt | date: 'medium' }}</time>
          @if (comment().isEdited) {
            <span class="comment-item__edited">Edited</span>
          }
        </header>

        @if (editing()) {
          <ng-content select="[editor]" />
        } @else {
          <div class="comment-item__content" [innerHTML]="contentHtml()"></div>
          @if (comment().mentions.length) {
            <div class="comment-item__mentions">
              @for (mention of comment().mentions; track mention.id) {
                <app-mention-chip [label]="'@' + mentionLabel(mention)" />
              }
            </div>
          }
          <app-comment-actions
            [canReply]="canReply()"
            [canEdit]="canEdit()"
            [canDelete]="canDelete()"
            [hasReplies]="replyCount() > 0"
            [replyCount]="replyCount()"
            [collapsed]="collapsed()"
            (reply)="reply.emit()"
            (edit)="edit.emit()"
            (delete)="delete.emit()"
            (toggleThread)="toggleThread.emit()"
          />
        }
      </div>
    </article>
  `,
  styles: `
    .comment-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
    }

    .comment-item--deleted {
      opacity: 0.7;
    }

    .comment-item__header {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.375rem;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .comment-item__edited {
      padding: 0.125rem 0.375rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-high);
      font: var(--mat-sys-label-small);
    }

    .comment-item__content {
      font: var(--mat-sys-body-medium);
      line-height: 1.5;
    }

    .comment-item__mentions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentItemComponent {
  readonly comment = input.required<Comment>();
  readonly canReply = input(true);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly editing = input(false);
  readonly collapsed = input(false);
  readonly replyCount = input(0);
  readonly reply = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly toggleThread = output<void>();

  authorName() {
    return authorDisplayName(this.comment());
  }

  contentHtml() {
    return this.comment().isDeleted
      ? 'Comment deleted'
      : renderMarkdownPreview(this.comment().content);
  }

  mentionLabel(mention: Comment['mentions'][number]) {
    return mentionDisplayName(mention);
  }
}
