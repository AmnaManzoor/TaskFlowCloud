import type { StatusVariant } from '@shared/components/status-badge/status-badge.component';
import type { PriorityLevel } from '@shared/components/priority-badge/priority-badge.component';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';
import type { ChecklistItem, Task, TaskSummary } from '@features/tasks/models/task.models';

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]: 'Backlog',
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.InReview]: 'In Review',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Cancelled]: 'Cancelled',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.High]: 'High',
  [TaskPriority.Critical]: 'Critical',
};

const TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.Feature]: 'Feature',
  [TaskType.Bug]: 'Bug',
  [TaskType.Improvement]: 'Improvement',
  [TaskType.Epic]: 'Epic',
  [TaskType.Story]: 'Story',
  [TaskType.Spike]: 'Spike',
};

const PRIORITY_LEVELS: Record<TaskPriority, PriorityLevel> = {
  [TaskPriority.Low]: 'low',
  [TaskPriority.Medium]: 'medium',
  [TaskPriority.High]: 'high',
  [TaskPriority.Critical]: 'critical',
};

export function taskStatusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status] ?? 'Unknown';
}

export function taskPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority] ?? 'Medium';
}

export function taskTypeLabel(type: TaskType): string {
  return TYPE_LABELS[type] ?? 'Feature';
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
  return PRIORITY_LEVELS[priority] ?? 'medium';
}

export function assigneeDisplayName(assignee: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const name = `${assignee.firstName} ${assignee.lastName}`.trim();
  return name || assignee.email;
}

export function checklistProgress(checklists: ChecklistItem[] | null | undefined): number {
  if (!checklists?.length) return 0;
  const completed = checklists.filter((item) => item.isCompleted).length;
  return Math.round((completed / checklists.length) * 100);
}

export function summaryChecklistProgress(summary: TaskSummary | null | undefined): number {
  if (!summary?.checklistCount) return 0;
  return Math.round((summary.completedChecklistCount / summary.checklistCount) * 100);
}

export function subtaskProgress(task: Task): number {
  const summary = task.summary;
  if (!summary?.subtaskCount) return 0;
  return 0;
}

export function remainingHours(task: Task): number | null {
  if (task.estimatedHours == null) return null;
  const actual = task.actualHours ?? 0;
  return Math.max(0, task.estimatedHours - actual);
}

export function timeTrackingProgress(task: Task): number {
  if (!task.estimatedHours || task.estimatedHours <= 0) return 0;
  const actual = task.actualHours ?? 0;
  return Math.min(100, Math.round((actual / task.estimatedHours) * 100));
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === TaskStatus.Completed) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(
    Object.values(TaskStatus)
      .filter((value) => typeof value === 'number')
      .map((status) => [status, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>;

  for (const task of tasks) {
    groups[task.status]?.push(task);
  }

  return groups;
}

export function activityIcon(activityType: string): string {
  const normalized = activityType.toLowerCase();
  if (normalized.includes('complete')) return 'task_alt';
  if (normalized.includes('assign')) return 'person_add';
  if (normalized.includes('priority')) return 'flag';
  if (normalized.includes('status')) return 'swap_horiz';
  if (normalized.includes('comment')) return 'chat_bubble_outline';
  if (normalized.includes('attach')) return 'attach_file';
  if (normalized.includes('create')) return 'add_circle_outline';
  return 'history';
}
