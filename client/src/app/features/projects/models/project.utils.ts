import {
  ProjectPriority,
  ProjectRole,
  ProjectStatus,
} from '@features/projects/models/project.enums';
import type { Project } from '@features/projects/models/project.models';
import type { StatusVariant } from '@shared/components/status-badge/status-badge.component';
import type { PriorityLevel } from '@shared/components/priority-badge/priority-badge.component';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.Draft]: 'Draft',
  [ProjectStatus.Active]: 'Active',
  [ProjectStatus.OnHold]: 'On Hold',
  [ProjectStatus.Completed]: 'Completed',
  [ProjectStatus.Cancelled]: 'Cancelled',
  [ProjectStatus.Archived]: 'Archived',
};

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.Low]: 'Low',
  [ProjectPriority.Medium]: 'Medium',
  [ProjectPriority.High]: 'High',
  [ProjectPriority.Critical]: 'Critical',
};

const ROLE_LABELS: Record<ProjectRole, string> = {
  [ProjectRole.Viewer]: 'Viewer',
  [ProjectRole.Contributor]: 'Contributor',
  [ProjectRole.Manager]: 'Manager',
  [ProjectRole.Owner]: 'Owner',
};

const PRIORITY_LEVELS: Record<ProjectPriority, PriorityLevel> = {
  [ProjectPriority.Low]: 'low',
  [ProjectPriority.Medium]: 'medium',
  [ProjectPriority.High]: 'high',
  [ProjectPriority.Critical]: 'critical',
};

export function projectStatusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status] ?? 'Unknown';
}

export function projectPriorityLabel(priority: ProjectPriority): string {
  return PRIORITY_LABELS[priority] ?? 'Medium';
}

export function projectRoleLabel(role: ProjectRole): string {
  return ROLE_LABELS[role] ?? 'Viewer';
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

export function projectPriorityLevel(priority: ProjectPriority): PriorityLevel {
  return PRIORITY_LEVELS[priority] ?? 'medium';
}

export function projectProgressPercent(project: Project): number {
  if (project.status === ProjectStatus.Completed) {
    return 100;
  }
  if (project.status === ProjectStatus.Cancelled || project.isArchived) {
    return 0;
  }
  if (project.summary?.taskCount) {
    return Math.min(90, project.summary.taskCount * 5);
  }
  return 0;
}
