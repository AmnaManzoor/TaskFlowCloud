import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { NotificationService } from '@core/services/notification.service';
import { CommentApiService } from '@features/collaboration/services/comment-api.service';
import { CommentSortOrder } from '@features/collaboration/models/collaboration.enums';
import { buildCommentTree } from '@features/collaboration/models/collaboration.utils';
import type {
  Comment,
  CommentThread,
  CreateCommentRequest,
  ReplyCommentRequest,
  UpdateCommentRequest,
} from '@features/collaboration/models/collaboration.models';

@Injectable({ providedIn: 'root' })
export class CommentStore {
  private readonly commentApi = inject(CommentApiService);
  private readonly notification = inject(NotificationService);

  private readonly _taskId = signal<string | null>(null);
  private readonly _items = signal<Comment[]>([]);
  private readonly _threads = signal<Record<string, CommentThread>>({});
  private readonly _collapsed = signal<Record<string, boolean>>({});
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(50);
  private readonly _totalCount = signal(0);
  private readonly _sortOrder = signal<CommentSortOrder>(CommentSortOrder.NewestFirst);

  readonly taskId = this._taskId.asReadonly();
  readonly items = this._items.asReadonly();
  readonly threads = this._threads.asReadonly();
  readonly collapsed = this._collapsed.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();
  readonly hasMore = computed(() => this._items().length < this._totalCount());

  readonly commentTree = computed(() => {
    const sorted = [...this._items()].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return this._sortOrder() === CommentSortOrder.NewestFirst ? -diff : diff;
    });
    return buildCommentTree(sorted);
  });

  loadForTask(taskId: string): void {
    this._taskId.set(taskId);
    this._page.set(1);
    this._items.set([]);
    this._threads.set({});
    this.loadComments();
  }

  loadComments(append = false): void {
    const taskId = this._taskId();
    if (!taskId) return;

    if (append) {
      this._loadingMore.set(true);
    } else {
      this._loading.set(true);
    }
    this._error.set(null);

    const sortDescending = this._sortOrder() === CommentSortOrder.NewestFirst;

    this.commentApi
      .listByTask(taskId, {
        page: this._page(),
        pageSize: this._pageSize(),
        sortBy: 'createdAt',
        sortDescending,
        includeReplies: true,
      })
      .pipe(
        tap((result) => {
          this._totalCount.set(result.totalCount);
          this._items.update((current) => (append ? [...current, ...result.items] : result.items));
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load comments'));
          return of(null);
        }),
        finalize(() => {
          this._loading.set(false);
          this._loadingMore.set(false);
        }),
      )
      .subscribe();
  }

  loadMore(): void {
    if (!this.hasMore() || this._loadingMore()) return;
    this._page.update((page) => page + 1);
    this.loadComments(true);
  }

  loadThread(commentId: string): void {
    this.commentApi
      .getThread(commentId)
      .pipe(
        tap((thread) => {
          this._threads.update((current) => ({ ...current, [commentId]: thread }));
          this._items.update((items) => {
            const map = new Map(items.map((item) => [item.id, item]));
            map.set(thread.root.id, thread.root);
            for (const reply of thread.replies) {
              map.set(reply.id, reply);
            }
            return [...map.values()];
          });
        }),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  create(request: CreateCommentRequest, onSuccess?: () => void): void {
    const taskId = this._taskId();
    if (!taskId) return;

    this._saving.set(true);
    this.commentApi
      .create(taskId, request)
      .pipe(
        tap((comment) => {
          this._items.update((items) => [comment, ...items]);
          this._totalCount.update((count) => count + 1);
          this.notification.success('Comment posted');
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to post comment'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  reply(parentId: string, request: ReplyCommentRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.commentApi
      .reply(parentId, request)
      .pipe(
        tap((comment) => {
          this._items.update((items) => [...items, comment]);
          this._totalCount.update((count) => count + 1);
          this.notification.success('Reply posted');
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to post reply'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  update(id: string, request: UpdateCommentRequest, onSuccess?: () => void): void {
    this._saving.set(true);
    this.commentApi
      .update(id, request)
      .pipe(
        tap((comment) => {
          this._items.update((items) => items.map((item) => (item.id === id ? comment : item)));
          this.notification.success('Comment updated');
          onSuccess?.();
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update comment'));
          return of(null);
        }),
        finalize(() => this._saving.set(false)),
      )
      .subscribe();
  }

  delete(id: string): void {
    this.commentApi
      .remove(id)
      .pipe(
        tap(() => {
          this._items.update((items) =>
            items.map((item) =>
              item.id === id ? { ...item, isDeleted: true, content: 'Comment deleted' } : item,
            ),
          );
          this.notification.success('Comment deleted');
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete comment'));
          return of(null);
        }),
      )
      .subscribe();
  }

  setSortOrder(order: CommentSortOrder): void {
    this._sortOrder.set(order);
    this._page.set(1);
    this.loadComments();
  }

  toggleCollapsed(commentId: string): void {
    this._collapsed.update((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  }

  isCollapsed(commentId: string): boolean {
    return this._collapsed()[commentId] ?? false;
  }

  clear(): void {
    this._taskId.set(null);
    this._items.set([]);
    this._threads.set({});
    this._collapsed.set({});
    this._error.set(null);
    this._page.set(1);
    this._totalCount.set(0);
  }
}
