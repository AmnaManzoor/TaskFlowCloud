import {
  NotificationCategoryFilter,
  NotificationPriority,
  NotificationType,
} from '@features/notifications/models/notification.enums';
import type {
  ActivityDateGroup,
  ActivityHistoryItem,
} from '@features/notifications/models/activity.models';
import type {
  NotificationDateGroup,
  NotificationFilters,
  NotificationItem,
} from '@features/notifications/models/notification.models';

const TASK_TYPES = new Set<NotificationType>([
  NotificationType.TaskAssigned,
  NotificationType.TaskUnassigned,
  NotificationType.TaskUpdated,
  NotificationType.TaskCompleted,
  NotificationType.TaskReopened,
  NotificationType.TaskPriorityChanged,
  NotificationType.TaskDueDateChanged,
  NotificationType.TaskCommentAdded,
  NotificationType.MentionedInComment,
]);

const PROJECT_TYPES = new Set<NotificationType>([
  NotificationType.ProjectCreated,
  NotificationType.ProjectUpdated,
  NotificationType.ProjectArchived,
  NotificationType.ProjectOwnershipTransferred,
]);

const ORGANIZATION_TYPES = new Set<NotificationType>([
  NotificationType.OrganizationInvitation,
  NotificationType.RoleChanged,
  NotificationType.TeamMemberAdded,
]);

const HIGH_PRIORITY_TYPES = new Set<NotificationType>([
  NotificationType.MentionedInComment,
  NotificationType.TaskAssigned,
  NotificationType.OrganizationInvitation,
  NotificationType.RoleChanged,
  NotificationType.TaskPriorityChanged,
]);

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

export function formatDateGroupLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });

  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function groupNotificationsByDate(items: NotificationItem[]): NotificationDateGroup[] {
  return groupByDate(items, (item) => item.createdAt);
}

export function groupActivityByDate(items: ActivityHistoryItem[]): ActivityDateGroup[] {
  return groupByDate(items, (item) => item.createdAt);
}

function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): { label: string; dateKey: string; items: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateKey = toDateKey(getDate(item));
    const bucket = groups.get(dateKey);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, groupedItems]) => ({
      dateKey,
      label: formatDateGroupLabel(dateKey),
      items: groupedItems,
    }));
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.TaskAssigned:
    case NotificationType.TaskUnassigned:
      return 'person_add';
    case NotificationType.TaskUpdated:
    case NotificationType.TaskPriorityChanged:
    case NotificationType.TaskDueDateChanged:
      return 'edit';
    case NotificationType.TaskCompleted:
      return 'task_alt';
    case NotificationType.TaskReopened:
      return 'replay';
    case NotificationType.TaskCommentAdded:
      return 'chat';
    case NotificationType.MentionedInComment:
      return 'alternate_email';
    case NotificationType.ProjectCreated:
      return 'create_new_folder';
    case NotificationType.ProjectUpdated:
      return 'folder';
    case NotificationType.ProjectArchived:
      return 'inventory_2';
    case NotificationType.ProjectOwnershipTransferred:
      return 'swap_horiz';
    case NotificationType.OrganizationInvitation:
      return 'mail';
    case NotificationType.RoleChanged:
      return 'admin_panel_settings';
    case NotificationType.TeamMemberAdded:
      return 'group_add';
    case NotificationType.SystemNotification:
    default:
      return 'notifications';
  }
}

export function getNotificationTypeLabel(type: NotificationType): string {
  return NotificationType[type]?.replace(/([A-Z])/g, ' $1').trim() ?? 'Notification';
}

export function getNotificationPriority(type: NotificationType): NotificationPriority {
  if (HIGH_PRIORITY_TYPES.has(type)) {
    return NotificationPriority.High;
  }
  if (TASK_TYPES.has(type) || PROJECT_TYPES.has(type)) {
    return NotificationPriority.Normal;
  }
  return NotificationPriority.Low;
}

export function getNotificationRoute(item: NotificationItem): string | null {
  if (!item.referenceId) return null;

  switch (item.referenceType) {
    case 'Task':
      return `/tasks/board?task=${item.referenceId}`;
    case 'Project':
      return `/projects/${item.referenceId}`;
    case 'Organization':
      return `/organizations/${item.referenceId}`;
    case 'Comment':
      return item.referenceId ? `/tasks/board?task=${item.referenceId}` : null;
    default:
      return null;
  }
}

export function matchesCategoryFilter(
  item: NotificationItem,
  category: NotificationCategoryFilter,
): boolean {
  switch (category) {
    case NotificationCategoryFilter.Mentions:
      return item.type === NotificationType.MentionedInComment;
    case NotificationCategoryFilter.Tasks:
      return TASK_TYPES.has(item.type);
    case NotificationCategoryFilter.Projects:
      return PROJECT_TYPES.has(item.type);
    case NotificationCategoryFilter.Organization:
      return ORGANIZATION_TYPES.has(item.type);
    case NotificationCategoryFilter.System:
      return item.type === NotificationType.SystemNotification;
    default:
      return true;
  }
}

export function matchesKeyword(item: NotificationItem, keyword: string): boolean {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return (
    item.title.toLowerCase().includes(normalized) ||
    item.message.toLowerCase().includes(normalized) ||
    item.referenceType.toLowerCase().includes(normalized)
  );
}

export function buildNotificationApiQuery(filters: NotificationFilters): {
  isRead?: boolean;
  type?: NotificationType;
  createdFrom?: string;
  createdTo?: string;
  sortBy: string;
  sortDescending: boolean;
} {
  const query: {
    isRead?: boolean;
    type?: NotificationType;
    createdFrom?: string;
    createdTo?: string;
    sortBy: string;
    sortDescending: boolean;
  } = {
    sortBy: filters.sortBy,
    sortDescending: filters.sortDescending,
  };

  if (filters.read === 'unread') {
    query.isRead = false;
  } else if (filters.read === 'read') {
    query.isRead = true;
  }

  if (filters.type !== null) {
    query.type = filters.type;
  }

  if (filters.createdFrom) {
    query.createdFrom = filters.createdFrom;
  }
  if (filters.createdTo) {
    query.createdTo = filters.createdTo;
  }

  return query;
}

export function getActivityIcon(entityType: string, activityType: string): string {
  if (activityType.toLowerCase().includes('comment')) return 'chat';
  if (activityType.toLowerCase().includes('assign')) return 'person_add';
  if (activityType.toLowerCase().includes('complet')) return 'task_alt';
  if (activityType.toLowerCase().includes('archiv')) return 'inventory_2';

  switch (entityType) {
    case 'Task':
      return 'task_alt';
    case 'Project':
      return 'folder';
    case 'Organization':
      return 'business';
    case 'Comment':
      return 'chat';
    case 'Attachment':
      return 'attach_file';
    default:
      return 'history';
  }
}

export function getActivityRoute(item: ActivityHistoryItem): string | null {
  if (!item.entityId) return null;

  switch (item.entityType) {
    case 'Task':
      return `/tasks/board?task=${item.entityId}`;
    case 'Project':
      return `/projects/${item.entityId}`;
    case 'Organization':
      return `/organizations/${item.entityId}`;
    default:
      return null;
  }
}

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
