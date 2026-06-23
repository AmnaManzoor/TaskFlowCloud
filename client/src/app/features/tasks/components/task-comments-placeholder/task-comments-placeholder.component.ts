import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-task-comments-placeholder',
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state
      icon="chat_bubble_outline"
      title="Comments coming soon"
      description="Threaded discussions and mentions will be available in a future release."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentsPlaceholderComponent {}
