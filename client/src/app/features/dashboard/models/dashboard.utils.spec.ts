import {
  projectStatusLabel,
  taskPriorityLabel,
  taskStatusLabel,
} from '@features/dashboard/models/dashboard.utils';
import { ProjectStatus, TaskPriority, TaskStatus } from '@features/dashboard/models/dashboard.models';

describe('dashboard.utils', () => {
  it('should map project status labels', () => {
    expect(projectStatusLabel(ProjectStatus.Active)).toBe('Active');
  });

  it('should map task status labels', () => {
    expect(taskStatusLabel(TaskStatus.InProgress)).toBe('In Progress');
  });

  it('should map task priority labels', () => {
    expect(taskPriorityLabel(TaskPriority.Critical)).toBe('Critical');
  });
});
