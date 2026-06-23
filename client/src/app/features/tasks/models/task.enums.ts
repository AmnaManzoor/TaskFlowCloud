export enum TaskStatus {
  Backlog = 0,
  Todo = 1,
  InProgress = 2,
  InReview = 3,
  Blocked = 4,
  Completed = 5,
  Cancelled = 6,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum TaskType {
  Feature = 0,
  Bug = 1,
  Improvement = 2,
  Epic = 3,
  Story = 4,
  Spike = 5,
}

export type TaskViewMode = 'board' | 'list' | 'calendar';

export const BOARD_COLUMN_STATUSES: readonly TaskStatus[] = [
  TaskStatus.Backlog,
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.InReview,
  TaskStatus.Blocked,
  TaskStatus.Completed,
] as const;
