import { TaskPriority, TaskStatus } from '@features/tasks/models/task.enums';
import {
  checklistProgress,
  isOverdue,
  taskPriorityLabel,
  taskStatusLabel,
  timeTrackingProgress,
} from '@features/tasks/models/task.utils';
import type { ChecklistItem, Task } from '@features/tasks/models/task.models';

describe('task.utils', () => {
  it('should label statuses and priorities', () => {
    expect(taskStatusLabel(TaskStatus.InProgress)).toBe('In Progress');
    expect(taskPriorityLabel(TaskPriority.Critical)).toBe('Critical');
  });

  it('should compute checklist progress', () => {
    const items: ChecklistItem[] = [
      { id: '1', taskId: 't', title: 'A', isCompleted: true, order: 0 },
      { id: '2', taskId: 't', title: 'B', isCompleted: false, order: 1 },
    ];
    expect(checklistProgress(items)).toBe(50);
  });

  it('should detect overdue tasks', () => {
    const task = {
      dueDate: '2000-01-01',
      status: TaskStatus.Todo,
    } as Task;
    expect(isOverdue(task)).toBeTrue();
  });

  it('should compute time tracking progress', () => {
    const task = { estimatedHours: 10, actualHours: 5 } as Task;
    expect(timeTrackingProgress(task)).toBe(50);
  });
});
