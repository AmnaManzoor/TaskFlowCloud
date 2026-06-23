import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProjectPriority, ProjectStatus } from '@features/projects/models/project.enums';
import {
  projectPriorityLabel,
  projectStatusLabel,
} from '@features/projects/models/project.utils';

export interface ProjectFormGroup {
  organizationId: FormGroup['controls'][string];
  name: FormGroup['controls'][string];
  code: FormGroup['controls'][string];
  description: FormGroup['controls'][string];
  status: FormGroup['controls'][string];
  priority: FormGroup['controls'][string];
  startDate: FormGroup['controls'][string];
  endDate: FormGroup['controls'][string];
  estimatedCompletionDate: FormGroup['controls'][string];
}

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="project-form" [formGroup]="form()">
      @if (showOrganization()) {
        <mat-form-field appearance="outline" class="project-form__field">
          <mat-label>Organization</mat-label>
          <mat-select formControlName="organizationId" required>
            @for (org of organizations(); track org.id) {
              <mat-option [value]="org.id">{{ org.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="project-form__field">
        <mat-label>Project name</mat-label>
        <input matInput formControlName="name" required />
      </mat-form-field>

      @if (showCode()) {
        <mat-form-field appearance="outline" class="project-form__field">
          <mat-label>Project code</mat-label>
          <input matInput formControlName="code" required placeholder="MY-PROJECT" />
          <mat-hint>Letters, numbers, hyphens, underscores</mat-hint>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="project-form__field">
        <mat-label>Description</mat-label>
        <textarea matInput rows="4" formControlName="description"></textarea>
      </mat-form-field>

      @if (showStatusPriority()) {
        <div class="project-form__row">
          <mat-form-field appearance="outline" class="project-form__field">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (status of statuses; track status) {
                <mat-option [value]="status">{{ projectStatusLabel(status) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="project-form__field">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              @for (priority of priorities; track priority) {
                <mat-option [value]="priority">{{ projectPriorityLabel(priority) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      }

      <div class="project-form__row">
        <mat-form-field appearance="outline" class="project-form__field">
          <mat-label>Start date</mat-label>
          <input matInput type="date" formControlName="startDate" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="project-form__field">
          <mat-label>End date</mat-label>
          <input matInput type="date" formControlName="endDate" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="project-form__field">
        <mat-label>Estimated completion</mat-label>
        <input matInput type="date" formControlName="estimatedCompletionDate" />
      </mat-form-field>
    </div>
  `,
  styles: `
    .project-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .project-form__field {
      width: 100%;
    }

    .project-form__row {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  readonly form = input.required<FormGroup>();
  readonly organizations = input<{ id: string; name: string }[]>([]);
  readonly showOrganization = input(true);
  readonly showCode = input(true);
  readonly showStatusPriority = input(true);

  readonly statuses = [
    ProjectStatus.Draft,
    ProjectStatus.Active,
    ProjectStatus.OnHold,
    ProjectStatus.Completed,
    ProjectStatus.Cancelled,
  ];
  readonly priorities = [
    ProjectPriority.Low,
    ProjectPriority.Medium,
    ProjectPriority.High,
    ProjectPriority.Critical,
  ];
  readonly projectStatusLabel = projectStatusLabel;
  readonly projectPriorityLabel = projectPriorityLabel;
}
