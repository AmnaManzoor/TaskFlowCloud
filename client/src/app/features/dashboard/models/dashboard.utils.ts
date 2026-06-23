import {
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@features/dashboard/models/dashboard.models';
import type { StatusVariant } from '@shared/components/status-badge/status-badge.component';
import type { PriorityLevel } from '@shared/components/priority-badge/priority-badge.component';

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.Draft]: 'Draft',
  [ProjectStatus.Active]: 'Active',
  [ProjectStatus.OnHold]: 'On Hold',
  [ProjectStatus.Completed]: 'Completed',
  [ProjectStatus.Cancelled]: 'Cancelled',
  [ProjectStatus.Archived]: 'Archived',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]: 'Backlog',
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.InReview]: 'In Review',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Cancelled]: 'Cancelled',
};

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.High]: 'High',
  [TaskPriority.Critical]: 'Critical',
};

const PROJECT_PRIORITY_LEVELS: Record<ProjectPriority, PriorityLevel> = {
  [ProjectPriority.Low]: 'low',
  [ProjectPriority.Medium]: 'medium',
  [ProjectPriority.High]: 'high',
  [ProjectPriority.Critical]: 'critical',
};

const TASK_PRIORITY_LEVELS: Record<TaskPriority, PriorityLevel> = {
  [TaskPriority.Low]: 'low',
  [TaskPriority.Medium]: 'medium',
  [TaskPriority.High]: 'high',
  [TaskPriority.Critical]: 'critical',
};

export function projectStatusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_LABELS[status] ?? 'Unknown';
}

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status] ?? 'Unknown';
}

export function taskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority] ?? 'Medium';
}

export function projectStatusVariant(status: ProjectStatus): StatusVariant {
  switch (status) {
    case ProjectStatus.Active:
      return 'info';
    case ProjectStatus.Completed:
      return 'success';
    case ProjectStatus.OnHold:
      return 'warning';
    case ProjectStatus.Cancelled:
    case ProjectStatus.Archived:
      return 'error';
    default:
      return 'default';
  }
}

export function taskStatusVariant(status: TaskStatus): StatusVariant {
  switch (status) {
    case TaskStatus.Completed:
      return 'success';
    case TaskStatus.InProgress:
    case TaskStatus.InReview:
      return 'info';
    case TaskStatus.Blocked:
      return 'error';
    case TaskStatus.Todo:
    case TaskStatus.Backlog:
      return 'warning';
    default:
      return 'default';
  }
}

export function taskPriorityLevel(priority: TaskPriority): PriorityLevel {
  return TASK_PRIORITY_LEVELS[priority] ?? 'medium';
}

export function projectPriorityLevel(priority: ProjectPriority): PriorityLevel {
  return PROJECT_PRIORITY_LEVELS[priority] ?? 'medium';
}

export function activityIcon(activityType: string): string {
  const normalized = activityType.toLowerCase();

  if (normalized.includes('complete')) {
    return 'task_alt';
  }
  if (normalized.includes('comment')) {
    return 'chat_bubble_outline';
  }
  if (normalized.includes('project')) {
    return 'folder_open';
  }
  if (normalized.includes('attach')) {
    return 'attach_file';
  }
  if (normalized.includes('notification')) {
    return 'notifications';
  }
  if (normalized.includes('create')) {
    return 'add_circle_outline';
  }

  return 'history';
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function breakdownValue(breakdown: Record<string, number> | undefined, key: string): number {
  return breakdown?.[key] ?? 0;
}
