import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserAvatarGroupComponent } from '@shared/components/user-avatar-group/user-avatar-group.component';
import { assigneeDisplayName } from '@features/tasks/models/task.utils';
import type { TaskAssignee } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-assignees',
  imports: [UserAvatarGroupComponent, MatButtonModule, MatIconModule],
  template: `
    <div class="task-assignees">
      <app-user-avatar-group [members]="avatarMembers()" [maxVisible]="maxVisible()" />
      @if (editable()) {
        <button mat-icon-button type="button" aria-label="Manage assignees" (click)="manage.emit()">
          <mat-icon>person_add</mat-icon>
        </button>
      }
    </div>
  `,
  styles: `
    .task-assignees {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAssigneesComponent {
  readonly assignees = input<TaskAssignee[]>([]);
  readonly editable = input(false);
  readonly maxVisible = input(4);
  readonly manage = output<void>();

  readonly avatarMembers = computed(() =>
    this.assignees().map((assignee) => ({
      id: assignee.userId,
      name: assigneeDisplayName(assignee),
    })),
  );
}
