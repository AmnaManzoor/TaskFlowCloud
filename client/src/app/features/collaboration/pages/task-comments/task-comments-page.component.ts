import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommentListComponent } from '@features/collaboration/components/comment-list/comment-list.component';

@Component({
  selector: 'app-task-comments-page',
  imports: [CommentListComponent],
  template: `<app-comment-list [taskId]="taskId()" [canComment]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentsPageComponent {
  readonly taskId = input.required<string>({ alias: 'taskId' });
}
