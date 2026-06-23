import type {
  NotificationCategoryFilter,
  NotificationReadFilter,
  NotificationSortField,
  NotificationType,
} from '@features/notifications/models/notification.enums';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

export interface NotificationListQuery {
  page?: number;
  pageSize?: number;
  isRead?: boolean | null;
  type?: NotificationType | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  sortBy?: NotificationSortField | string | null;
  sortDescending?: boolean;
}

export interface NotificationFilters {
  read: NotificationReadFilter;
  category: NotificationCategoryFilter;
  type: NotificationType | null;
  createdFrom: string | null;
  createdTo: string | null;
  keyword: string;
  projectId: string | null;
  organizationId: string | null;
  sortBy: NotificationSortField;
  sortDescending: boolean;
}

export interface NotificationDateGroup {
  label: string;
  dateKey: string;
  items: NotificationItem[];
}

export interface NotificationSettings {
  pollingEnabled: boolean;
  pollingIntervalMs: number;
  showReadInDrawer: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pollingEnabled: true,
  pollingIntervalMs: 45_000,
  showReadInDrawer: false,
};

export const NOTIFICATION_PAGE_SIZE = 20;
export const DRAWER_NOTIFICATION_LIMIT = 8;
export const POLLING_INTERVAL_MIN_MS = 30_000;
export const POLLING_INTERVAL_MAX_MS = 60_000;
