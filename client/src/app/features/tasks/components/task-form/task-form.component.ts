import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';
import { taskPriorityLabel, taskStatusLabel, taskTypeLabel } from '@features/tasks/models/task.utils';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="task-form" [formGroup]="form()">
      @if (showProject()) {
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Project</mat-label>
          <mat-select formControlName="projectId" required>
            @for (project of projects(); track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="task-form__field">
        <mat-label>Title</mat-label>
        <input matInput formControlName="title" required />
      </mat-form-field>

      <mat-form-field appearance="outline" class="task-form__field">
        <mat-label>Description</mat-label>
        <textarea matInput rows="4" formControlName="description"></textarea>
      </mat-form-field>

      <div class="task-form__row">
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ taskStatusLabel(status) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            @for (priority of priorities; track priority) {
              <mat-option [value]="priority">{{ taskPriorityLabel(priority) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (type of types; track type) {
              <mat-option [value]="type">{{ taskTypeLabel(type) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="task-form__row">
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Start date</mat-label>
          <input matInput type="date" formControlName="startDate" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Due date</mat-label>
          <input matInput type="date" formControlName="dueDate" />
        </mat-form-field>
      </div>

      <div class="task-form__row">
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Estimated hours</mat-label>
          <input matInput type="number" min="0" step="0.5" formControlName="estimatedHours" />
        </mat-form-field>
        @if (showActualHours()) {
          <mat-form-field appearance="outline" class="task-form__field">
            <mat-label>Actual hours</mat-label>
            <input matInput type="number" min="0" step="0.5" formControlName="actualHours" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="task-form__field">
          <mat-label>Story points</mat-label>
          <input matInput type="number" min="0" formControlName="storyPoints" />
        </mat-form-field>
      </div>
    </div>
  `,
  styles: `
    .task-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-form__field {
      width: 100%;
    }

    .task-form__row {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  readonly form = input.required<FormGroup>();
  readonly projects = input<{ id: string; name: string }[]>([]);
  readonly showProject = input(true);
  readonly showActualHours = input(false);

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
}
