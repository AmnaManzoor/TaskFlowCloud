import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';
import { taskPriorityLabel, taskStatusLabel, taskTypeLabel } from '@features/tasks/models/task.utils';
import type { TaskFilters } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-filter',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  template: `
    <div class="task-filter" role="search">
      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Project</mat-label>
        <mat-select [ngModel]="filters().projectId" (ngModelChange)="patch({ projectId: $event })">
          <mat-option [value]="null">All projects</mat-option>
          @for (project of projects(); track project.id) {
            <mat-option [value]="project.id">{{ project.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Status</mat-label>
        <mat-select [ngModel]="filters().status" (ngModelChange)="patch({ status: $event })">
          <mat-option [value]="null">Any status</mat-option>
          @for (status of statuses; track status) {
            <mat-option [value]="status">{{ taskStatusLabel(status) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Priority</mat-label>
        <mat-select [ngModel]="filters().priority" (ngModelChange)="patch({ priority: $event })">
          <mat-option [value]="null">Any priority</mat-option>
          @for (priority of priorities; track priority) {
            <mat-option [value]="priority">{{ taskPriorityLabel(priority) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Type</mat-label>
        <mat-select [ngModel]="filters().type" (ngModelChange)="patch({ type: $event })">
          <mat-option [value]="null">Any type</mat-option>
          @for (type of types; track type) {
            <mat-option [value]="type">{{ taskTypeLabel(type) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Due from</mat-label>
        <input matInput type="date" [ngModel]="filters().dueDateFrom" (ngModelChange)="patch({ dueDateFrom: $event })" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-filter__field">
        <mat-label>Due to</mat-label>
        <input matInput type="date" [ngModel]="filters().dueDateTo" (ngModelChange)="patch({ dueDateTo: $event })" />
      </mat-form-field>
    </div>
  `,
  styles: `
    .task-filter {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      margin-bottom: 1rem;
    }

    .task-filter__field {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterComponent {
  readonly filters = input.required<TaskFilters>();
  readonly projects = input<{ id: string; name: string }[]>([]);
  readonly filtersChange = output<Partial<TaskFilters>>();

  readonly taskStatusLabel = taskStatusLabel;
  readonly taskPriorityLabel = taskPriorityLabel;
  readonly taskTypeLabel = taskTypeLabel;

  readonly statuses = [
    TaskStatus.Backlog,
    TaskStatus.Todo,
    TaskStatus.InProgress,
    TaskStatus.InReview,
    TaskStatus.Blocked,
    TaskStatus.Completed,
    TaskStatus.Cancelled,
  ];
  readonly priorities = [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical];
  readonly types = [
    TaskType.Feature,
    TaskType.Bug,
    TaskType.Improvement,
    TaskType.Epic,
    TaskType.Story,
    TaskType.Spike,
  ];

  patch(partial: Partial<TaskFilters>): void {
    this.filtersChange.emit(partial);
  }
}
