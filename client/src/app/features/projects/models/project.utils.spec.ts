import { projectStatusLabel, projectProgressPercent } from '@features/projects/models/project.utils';
import { ProjectPriority, ProjectStatus } from '@features/projects/models/project.enums';
import type { Project } from '@features/projects/models/project.models';

describe('project.utils', () => {
  const baseProject: Project = {
    id: '1',
    organizationId: 'org',
    name: 'Test',
    code: 'TST',
    description: null,
    status: ProjectStatus.Active,
    priority: ProjectPriority.Medium,
    startDate: null,
    endDate: null,
    estimatedCompletionDate: null,
    ownerId: 'user',
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    rowVersion: 'abc',
  };

  it('should map status labels', () => {
    expect(projectStatusLabel(ProjectStatus.Active)).toBe('Active');
  });

  it('should compute completed progress as 100', () => {
    expect(projectProgressPercent({ ...baseProject, status: ProjectStatus.Completed })).toBe(100);
  });
});
