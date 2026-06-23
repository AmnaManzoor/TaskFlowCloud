import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  AddMentionsRequest,
  Comment,
  CommentListQuery,
  CommentThread,
  CreateCommentRequest,
  PagedResult,
  ReplyCommentRequest,
  UpdateCommentRequest,
} from '@features/collaboration/models/collaboration.models';

@Injectable({ providedIn: 'root' })
export class CommentApiService extends ApiBaseService {
  listByTask(taskId: string, query: CommentListQuery = {}): Observable<PagedResult<Comment>> {
    return this.get<PagedResult<Comment>>(`/tasks/${taskId}/comments`, {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  getById(id: string): Observable<Comment> {
    return this.get<Comment>(`/comments/${id}`, { skipLoading: true });
  }

  getThread(id: string): Observable<CommentThread> {
    return this.get<CommentThread>(`/comments/${id}/thread`, { skipLoading: true });
  }

  create(taskId: string, request: CreateCommentRequest): Observable<Comment> {
    return this.post<Comment>(`/tasks/${taskId}/comments`, request);
  }

  update(id: string, request: UpdateCommentRequest): Observable<Comment> {
    return this.put<Comment>(`/comments/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return super.delete(`/comments/${id}`);
  }

  reply(id: string, request: ReplyCommentRequest): Observable<Comment> {
    return this.post<Comment>(`/comments/${id}/reply`, request);
  }

  addMentions(id: string, request: AddMentionsRequest): Observable<Comment> {
    return this.post<Comment>(`/comments/${id}/mentions`, request);
  }

  private buildParams(query: CommentListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params[key] = value as string | number | boolean;
      }
    }
    return params;
  }
}
