import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-project-tasks-placeholder-page',
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state
      icon="task"
      title="Tasks module coming soon"
      description="Task boards, backlogs, and sprint planning will be implemented in the next feature prompt."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTasksPlaceholderPageComponent {}

@Component({
  selector: 'app-project-activity-placeholder-page',
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state
      icon="history"
      title="Activity feed coming soon"
      description="Project activity timeline will be available in a future release."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectActivityPlaceholderPageComponent {}
