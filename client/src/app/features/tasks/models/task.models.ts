import type { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TaskSummary {
  subtaskCount: number;
  assigneeCount: number;
  labelCount: number;
  checklistCount: number;
  completedChecklistCount: number;
  dependencyCount: number;
}

export interface TaskAssignee {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedAt: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTitle: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  storyPoints: number | null;
  parentTaskId: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  rowVersion: string;
  assignees?: TaskAssignee[] | null;
  labels?: TaskLabel[] | null;
  checklists?: ChecklistItem[] | null;
  dependencies?: TaskDependency[] | null;
  summary?: TaskSummary | null;
}

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  storyPoints?: number | null;
  parentTaskId?: string | null;
  assigneeIds?: string[] | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  type: TaskType;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  storyPoints?: number | null;
  rowVersion: string;
}

export interface AssignTaskUsersRequest {
  userIds: string[];
}

export interface ChangeTaskStatusRequest {
  status: TaskStatus;
}

export interface ChangeTaskPriorityRequest {
  priority: TaskPriority;
}

export interface UpdateTaskHoursRequest {
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export interface MoveTaskRequest {
  targetProjectId: string;
}

export interface AddTaskLabelRequest {
  labelId?: string | null;
  name?: string | null;
  color?: string | null;
}

export interface CreateChecklistRequest {
  title: string;
  order?: number;
}

export interface UpdateChecklistRequest {
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  projectId?: string | null;
  search?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  type?: TaskType | null;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface TaskSearchQuery {
  page?: number;
  pageSize?: number;
  title?: string | null;
  description?: string | null;
  projectId?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  type?: TaskType | null;
  assigneeId?: string | null;
  labelId?: string | null;
  startDateFrom?: string | null;
  startDateTo?: string | null;
  dueDateFrom?: string | null;
  dueDateTo?: string | null;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface TaskFilters {
  projectId: string | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  type: TaskType | null;
  assigneeId: string | null;
  labelId: string | null;
  dueDateFrom: string | null;
  dueDateTo: string | null;
  createdFrom: string | null;
  createdTo: string | null;
}

export interface ActivityListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  activityType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
}
