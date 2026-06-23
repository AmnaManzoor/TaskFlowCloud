import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-task-attachments-placeholder',
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state
      icon="attach_file"
      title="Attachments coming soon"
      description="File uploads and previews will be available in a future release."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAttachmentsPlaceholderComponent {}
