import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { CommentEditorComponent } from '@features/collaboration/components/comment-editor/comment-editor.component';
import { CommentThreadComponent } from '@features/collaboration/components/comment-thread/comment-thread.component';
import { CommentStore } from '@features/collaboration/stores/comment.store';
import { CommentSortOrder } from '@features/collaboration/models/collaboration.enums';
import type { MentionUserOption } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-comment-list',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    CommentEditorComponent,
    CommentThreadComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="comment-list">
      <div class="comment-list__toolbar">
        <mat-button-toggle-group
          [value]="store.sortOrder()"
          (change)="onSortChange($event.value)"
          aria-label="Comment sort order"
        >
          <mat-button-toggle [value]="sortNewest">Newest</mat-button-toggle>
          <mat-button-toggle [value]="sortOldest">Oldest</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (canComment()) {
        <app-comment-editor
          [taskId]="taskId()"
          [mentionUsers]="mentionUsers()"
          [saving]="store.saving()"
          (submitted)="createComment($event)"
        />
      }

      @if (store.error()) {
        <app-widget-error [message]="store.error()!" (retry)="store.loadComments()" />
      } @else if (store.loading()) {
        <app-skeleton-loader [rows]="4" />
      } @else if (store.commentTree().length === 0) {
        <app-empty-state
          icon="chat_bubble_outline"
          title="No comments yet"
          description="Start the discussion with the first comment on this task."
        />
      } @else {
        <div class="comment-list__threads">
          @for (node of store.commentTree(); track node.comment.id) {
            <app-comment-thread
              [node]="node"
              [taskId]="taskId()"
              [currentUserId]="currentUserId()"
              [canReply]="canComment()"
              [mentionUsers]="mentionUsers()"
              [saving]="store.saving()"
              [collapsedMap]="store.collapsed()"
              (replyComment)="onReply($event)"
              (updateComment)="onUpdate($event)"
              (deleteComment)="onDelete($event)"
              (toggleCollapse)="store.toggleCollapsed($event)"
            />
          }
        </div>

        @if (store.hasMore()) {
          <button mat-stroked-button type="button" class="comment-list__more" (click)="store.loadMore()">
            @if (store.loadingMore()) {
              Loading...
            } @else {
              Load more comments
            }
          </button>
        }
      }
    </div>
  `,
  styles: `
    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment-list__toolbar {
      display: flex;
      justify-content: flex-end;
    }

    .comment-list__threads {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .comment-list__more {
      align-self: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentListComponent implements OnInit {
  readonly taskId = input.required<string>();
  readonly currentUserId = input<string | null>(null);
  readonly canComment = input(true);
  readonly mentionUsers = input<MentionUserOption[]>([]);
  readonly deleteRequest = output<string>();

  readonly store = inject(CommentStore);
  readonly sortNewest = CommentSortOrder.NewestFirst;
  readonly sortOldest = CommentSortOrder.OldestFirst;

  ngOnInit(): void {
    this.store.loadForTask(this.taskId());
  }

  onSortChange(value: CommentSortOrder): void {
    if (value) {
      this.store.setSortOrder(value);
    }
  }

  createComment(event: { content: string; mentionedUserIds: string[] }): void {
    this.store.create(event);
  }

  onReply(event: { parentId: string; content: string; mentionedUserIds: string[] }): void {
    this.store.reply(event.parentId, {
      content: event.content,
      mentionedUserIds: event.mentionedUserIds,
    });
  }

  onUpdate(event: { id: string; content: string }): void {
    this.store.update(event.id, { content: event.content });
  }

  onDelete(commentId: string): void {
    this.deleteRequest.emit(commentId);
  }
}
