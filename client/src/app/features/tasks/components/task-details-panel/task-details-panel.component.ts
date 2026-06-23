import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { TaskCollaborationPanelComponent } from '@features/collaboration/components/task-collaboration-panel/task-collaboration-panel.component';
import { TaskAssigneesComponent } from '@features/tasks/components/task-assignees/task-assignees.component';
import { TaskChecklistComponent } from '@features/tasks/components/task-checklist/task-checklist.component';
import { TaskHeaderComponent } from '@features/tasks/components/task-header/task-header.component';
import { TaskLabelsComponent } from '@features/tasks/components/task-labels/task-labels.component';
import { TaskTimeTrackingComponent } from '@features/tasks/components/task-time-tracking/task-time-tracking.component';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-details-panel',
  imports: [
    MatProgressBarModule,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
    TaskHeaderComponent,
    TaskAssigneesComponent,
    TaskLabelsComponent,
    TaskChecklistComponent,
    TaskTimeTrackingComponent,
    TaskCollaborationPanelComponent,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
      <app-skeleton-loader [rows]="8" />
    } @else if (error()) {
      <app-widget-error [message]="error()!" (retry)="retry.emit()" />
    } @else if (task()) {
      <app-task-header
        [task]="task()!"
        [canEdit]="canEdit()"
        [canDelete]="canDelete()"
        (close)="close.emit()"
        (edit)="edit.emit()"
        (delete)="delete.emit()"
        (changeStatus)="changeStatus.emit()"
        (move)="move.emit()"
      />

      <div class="task-details">
        <section class="task-details__section">
          <h3>Description</h3>
          <p>{{ task()!.description || 'No description provided.' }}</p>
        </section>

        <section class="task-details__section">
          <h3>Assignees</h3>
          <app-task-assignees
            [assignees]="task()!.assignees ?? []"
            [editable]="canEdit()"
            (manage)="manageAssignees.emit()"
          />
        </section>

        <section class="task-details__section">
          <h3>Labels</h3>
          <app-task-labels
            [labels]="task()!.labels ?? []"
            [editable]="canEdit()"
            (addLabel)="addLabel.emit()"
            (removeLabel)="removeLabel.emit($event)"
          />
        </section>

        <section class="task-details__section">
          <app-task-checklist
            [items]="task()!.checklists ?? []"
            [editable]="canEdit()"
            (addItem)="addChecklistItem.emit($event)"
            (updateItem)="updateChecklistItem.emit($event)"
            (deleteItem)="deleteChecklistItem.emit($event)"
          />
        </section>

        @if (task()!.dependencies?.length) {
          <section class="task-details__section">
            <h3>Dependencies</h3>
            <ul class="task-details__deps">
              @for (dep of task()!.dependencies!; track dep.id) {
                <li>{{ dep.dependsOnTitle }}</li>
              }
            </ul>
          </section>
        }

        <section class="task-details__section">
          <app-task-time-tracking [task]="task()!" />
        </section>

        <section class="task-details__section task-details__section--collaboration">
          <app-task-collaboration-panel [taskId]="task()!.id" [canComment]="canEdit()" />
        </section>
      </div>
    }
  `,
  styles: `
    .task-details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-top: 1rem;
    }

    .task-details__section h3 {
      margin: 0 0 0.5rem;
      font: var(--mat-sys-title-small);
    }

    .task-details__section p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      white-space: pre-wrap;
    }

    .task-details__deps {
      margin: 0;
      padding-left: 1.25rem;
    }

    .task-details__section--collaboration {
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsPanelComponent {
  readonly task = input<Task | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly changeStatus = output<void>();
  readonly move = output<void>();
  readonly retry = output<void>();
  readonly manageAssignees = output<void>();
  readonly addLabel = output<void>();
  readonly removeLabel = output<string>();
  readonly addChecklistItem = output<string>();
  readonly updateChecklistItem = output<{
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
  }>();
  readonly deleteChecklistItem = output<string>();
}
