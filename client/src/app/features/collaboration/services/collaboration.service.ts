import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  ActivityHistoryItem,
  PagedResult,
} from '@features/collaboration/models/collaboration.models';

@Injectable({ providedIn: 'root' })
export class CollaborationService extends ApiBaseService {
  loadTaskActivity(
    taskId: string,
    page = 1,
    pageSize = 20,
  ): Observable<PagedResult<ActivityHistoryItem>> {
    return this.get<PagedResult<ActivityHistoryItem>>('/activity', {
      skipLoading: true,
      params: {
        entityType: 'Task',
        entityId: taskId,
        page,
        pageSize,
        sortDescending: true,
      },
    });
  }
}
