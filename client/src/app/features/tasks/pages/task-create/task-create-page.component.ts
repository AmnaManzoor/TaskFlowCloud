import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { TaskFormComponent } from '@features/tasks/components/task-form/task-form.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { TaskStore } from '@features/tasks/stores/task.store';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-create-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    PageHeaderComponent,
    LoadingButtonComponent,
    TaskFormComponent,
  ],
  template: `
    <app-page-header title="Create task" subtitle="Add a new task to a project" />

    <form [formGroup]="form" (ngSubmit)="submit()">
      <app-task-form [form]="form" [projects]="projects()" />

      <div class="actions">
        <button mat-button type="button" (click)="router.navigate(['/tasks/board'])">Cancel</button>
        <app-loading-button type="submit" [loading]="store.saving()" [disabled]="form.invalid">
          Create task
        </app-loading-button>
      </div>
    </form>
  `,
  styles: `
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreatePageComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly projectStore = inject(ProjectStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
    status: [TaskStatus.Backlog],
    priority: [TaskPriority.Medium],
    type: [TaskType.Feature],
    startDate: [''],
    dueDate: [''],
    estimatedHours: [null as number | null],
    storyPoints: [null as number | null],
  });

  ngOnInit(): void {
    this.projectStore.loadList();
  }

  projects() {
    return this.projectStore.items().map((project) => ({ id: project.id, name: project.name }));
  }

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.create(
      {
        projectId: value.projectId,
        title: value.title,
        description: value.description || null,
        status: value.status,
        priority: value.priority,
        type: value.type,
        startDate: value.startDate || null,
        dueDate: value.dueDate || null,
        estimatedHours: value.estimatedHours,
        storyPoints: value.storyPoints,
      },
      (task) => this.router.navigate(['/tasks/board'], { queryParams: { task: task.id } }),
    );
  }
}
