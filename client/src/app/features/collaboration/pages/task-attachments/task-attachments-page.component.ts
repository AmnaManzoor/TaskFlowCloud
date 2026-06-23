import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AttachmentListComponent } from '@features/collaboration/components/attachment-list/attachment-list.component';

@Component({
  selector: 'app-task-attachments-page',
  imports: [AttachmentListComponent],
  template: `<app-attachment-list [taskId]="taskId()" [canUpload]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAttachmentsPageComponent {
  readonly taskId = input.required<string>({ alias: 'taskId' });
}
