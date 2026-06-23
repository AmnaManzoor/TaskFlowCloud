import type { ActivityEntityFilter, ActivityScope } from '@features/notifications/models/notification.enums';
import type { PagedResult } from '@features/notifications/models/notification.models';

export type { PagedResult };

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export interface ActivityListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
  activityType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
}

export interface ActivityFilters {
  scope: ActivityScope;
  entityType: ActivityEntityFilter;
  activityType: string | null;
  createdFrom: string | null;
  createdTo: string | null;
  keyword: string;
  projectId: string | null;
  userId: string | null;
  sortDescending: boolean;
}

export interface ActivityDateGroup {
  label: string;
  dateKey: string;
  items: ActivityHistoryItem[];
}
