import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  NotificationCountResponse,
  NotificationItem,
  NotificationListQuery,
  PagedResult,
} from '@features/notifications/models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationApiService extends ApiBaseService {
  list(query: NotificationListQuery = {}): Observable<PagedResult<NotificationItem>> {
    return this.get<PagedResult<NotificationItem>>('/notifications', {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  listUnread(query: NotificationListQuery = {}): Observable<PagedResult<NotificationItem>> {
    return this.get<PagedResult<NotificationItem>>('/notifications/unread', {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  getCount(): Observable<NotificationCountResponse> {
    return this.get<NotificationCountResponse>('/notifications/count', { skipLoading: true });
  }

  getById(id: string): Observable<NotificationItem> {
    return this.get<NotificationItem>(`/notifications/${id}`, { skipLoading: true });
  }

  markRead(id: string): Observable<NotificationItem> {
    return this.patch<NotificationItem>(`/notifications/${id}/read`, {}, { skipLoading: true });
  }

  markUnread(id: string): Observable<NotificationItem> {
    return this.patch<NotificationItem>(`/notifications/${id}/unread`, {}, { skipLoading: true });
  }

  markAllRead(): Observable<{ count: number }> {
    return this.patch<{ count: number }>('/notifications/read-all', {}, { skipLoading: true });
  }

  remove(id: string): Observable<void> {
    return super.delete(`/notifications/${id}`, { skipLoading: true });
  }

  deleteAllRead(): Observable<{ count: number }> {
    return super.delete<{ count: number }>('/notifications/read', { skipLoading: true });
  }

  private buildParams(query: NotificationListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};

    if (query.page !== undefined) params['page'] = query.page;
    if (query.pageSize !== undefined) params['pageSize'] = query.pageSize;
    if (query.isRead !== undefined && query.isRead !== null) params['isRead'] = query.isRead;
    if (query.type !== undefined && query.type !== null) params['type'] = query.type;
    if (query.createdFrom) params['createdFrom'] = query.createdFrom;
    if (query.createdTo) params['createdTo'] = query.createdTo;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.sortDescending !== undefined) params['sortDescending'] = query.sortDescending;

    return params;
  }
}
