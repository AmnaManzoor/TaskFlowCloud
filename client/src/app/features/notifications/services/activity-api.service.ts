import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  ActivityHistoryItem,
  ActivityListQuery,
  PagedResult,
} from '@features/notifications/models/activity.models';

@Injectable({ providedIn: 'root' })
export class ActivityApiService extends ApiBaseService {
  list(query: ActivityListQuery = {}): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>('/activity', {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  listByUser(userId: string, query: ActivityListQuery = {}): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>(`/activity/user/${userId}`, {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  listByProject(
    projectId: string,
    query: ActivityListQuery = {},
  ): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>(`/activity/project/${projectId}`, {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  private buildParams(query: ActivityListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};

    if (query.page !== undefined) params['page'] = query.page;
    if (query.pageSize !== undefined) params['pageSize'] = query.pageSize;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.sortDescending !== undefined) params['sortDescending'] = query.sortDescending;
    if (query.activityType) params['activityType'] = query.activityType;
    if (query.entityType) params['entityType'] = query.entityType;
    if (query.entityId) params['entityId'] = query.entityId;
    if (query.createdFrom) params['createdFrom'] = query.createdFrom;
    if (query.createdTo) params['createdTo'] = query.createdTo;

    return params;
  }
}
