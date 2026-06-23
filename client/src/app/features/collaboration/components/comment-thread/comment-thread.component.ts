import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommentEditorComponent } from '@features/collaboration/components/comment-editor/comment-editor.component';
import { CommentItemComponent } from '@features/collaboration/components/comment-item/comment-item.component';
import type { CommentTreeNode, MentionUserOption } from '@features/collaboration/models/collaboration.models';
import type { Comment } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-comment-thread',
  imports: [CommentItemComponent, CommentEditorComponent],
  template: `
    <div class="comment-thread" [style.--depth]="depth()">
      <app-comment-item
        [comment]="node().comment"
        [canReply]="canReply()"
        [canEdit]="canEditComment(node().comment)"
        [canDelete]="canDeleteComment(node().comment)"
        [editing]="editingId() === node().comment.id"
        [collapsed]="collapsed()"
        [replyCount]="node().replies.length || node().comment.replyCount"
        (reply)="startReply(node().comment.id)"
        (edit)="startEdit(node().comment)"
        (delete)="deleteComment.emit(node().comment.id)"
        (toggleThread)="toggleCollapse.emit(node().comment.id)"
      >
        @if (editingId() === node().comment.id) {
          <div editor>
            <app-comment-editor
              [taskId]="taskId()"
              [parentCommentId]="node().comment.id"
              [initialContent]="node().comment.content"
              submitLabel="Save"
              [showCancel]="true"
              [saving]="saving()"
              [mentionUsers]="mentionUsers()"
              (submitted)="updateComment.emit({ id: node().comment.id, content: $event.content })"
              (cancel)="editingId.set(null)"
            />
          </div>
        }
      </app-comment-item>

      @if (replyingToId() === node().comment.id) {
        <app-comment-editor
          class="comment-thread__reply-editor"
          [taskId]="taskId()"
          [parentCommentId]="node().comment.id"
          placeholder="Write a reply..."
          submitLabel="Reply"
          [showCancel]="true"
          [saving]="saving()"
          [mentionUsers]="mentionUsers()"
          (submitted)="replyComment.emit({ parentId: node().comment.id, content: $event.content, mentionedUserIds: $event.mentionedUserIds })"
          (cancel)="replyingToId.set(null)"
        />
      }

      @if (!collapsed() && node().replies.length) {
        <div class="comment-thread__children">
          @for (child of node().replies; track child.comment.id) {
            <app-comment-thread
              [node]="child"
              [taskId]="taskId()"
              [depth]="depth() + 1"
              [currentUserId]="currentUserId()"
              [canReply]="canReply()"
              [mentionUsers]="mentionUsers()"
              [saving]="saving()"
              [collapsedMap]="collapsedMap()"
              (replyComment)="replyComment.emit($event)"
              (updateComment)="updateComment.emit($event)"
              (deleteComment)="deleteComment.emit($event)"
              (toggleCollapse)="toggleCollapse.emit($event)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: `
    .comment-thread {
      position: relative;
      margin-left: calc(var(--depth, 0) * 1rem);
    }

    .comment-thread__children {
      border-left: 2px solid var(--mat-sys-outline-variant);
      margin-left: 1rem;
      padding-left: 0.5rem;
    }

    .comment-thread__reply-editor {
      margin: 0.5rem 0 0.75rem 2.5rem;
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentThreadComponent {
  readonly node = input.required<CommentTreeNode>();
  readonly taskId = input.required<string>();
  readonly depth = input(0);
  readonly currentUserId = input<string | null>(null);
  readonly canReply = input(true);
  readonly mentionUsers = input<MentionUserOption[]>([]);
  readonly saving = input(false);
  readonly collapsedMap = input<Record<string, boolean>>({});
  readonly replyComment = output<{
    parentId: string;
    content: string;
    mentionedUserIds: string[];
  }>();
  readonly updateComment = output<{ id: string; content: string }>();
  readonly deleteComment = output<string>();
  readonly toggleCollapse = output<string>();

  readonly replyingToId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  collapsed() {
    return this.collapsedMap()[this.node().comment.id] ?? false;
  }

  canEditComment(comment: Comment) {
    return this.currentUserId() === comment.userId && !comment.isDeleted;
  }

  canDeleteComment(comment: Comment) {
    return this.currentUserId() === comment.userId && !comment.isDeleted;
  }

  startReply(commentId: string): void {
    this.replyingToId.set(commentId);
    this.editingId.set(null);
  }

  startEdit(comment: Comment): void {
    this.editingId.set(comment.id);
    this.replyingToId.set(null);
  }
}
