import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { TaskFormComponent } from '@features/tasks/components/task-form/task-form.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { TaskStore } from '@features/tasks/stores/task.store';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-edit-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    PageHeaderComponent,
    LoadingButtonComponent,
    TaskFormComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <app-page-header title="Edit task" subtitle="Update task details" />

    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="reload()" />
    } @else if (store.detailLoading()) {
      <app-skeleton-loader [rows]="6" />
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <app-task-form
          [form]="form"
          [projects]="projects()"
          [showProject]="false"
          [showActualHours]="true"
        />

        <div class="actions">
          <button mat-button type="button" (click)="goBack()">Cancel</button>
          <app-loading-button type="submit" [loading]="store.saving()" [disabled]="form.invalid">
            Save changes
          </app-loading-button>
        </div>
      </form>
    }
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
export class TaskEditPageComponent implements OnInit {
  readonly taskId = input.required<string>({ alias: 'taskId' });
  readonly store = inject(TaskStore);
  readonly projectStore = inject(ProjectStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    projectId: [''],
    title: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
    status: [TaskStatus.Backlog],
    priority: [TaskPriority.Medium],
    type: [TaskType.Feature],
    startDate: [''],
    dueDate: [''],
    estimatedHours: [null as number | null],
    actualHours: [null as number | null],
    storyPoints: [null as number | null],
  });

  constructor() {
    effect(() => {
      const task = this.store.selected();
      if (!task || task.id !== this.taskId()) return;
      this.form.patchValue({
        projectId: task.projectId,
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        type: task.type,
        startDate: task.startDate ?? '',
        dueDate: task.dueDate ?? '',
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        storyPoints: task.storyPoints,
      });
    });
  }

  ngOnInit(): void {
    this.projectStore.loadList();
    this.reload();
  }

  reload(): void {
    this.store.loadById(this.taskId());
  }

  projects() {
    return this.projectStore.items().map((project) => ({ id: project.id, name: project.name }));
  }

  submit(): void {
    const task = this.store.selected();
    if (!task || this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.update(
      task.id,
      {
        title: value.title,
        description: value.description || null,
        type: value.type,
        startDate: value.startDate || null,
        dueDate: value.dueDate || null,
        estimatedHours: value.estimatedHours,
        actualHours: value.actualHours,
        storyPoints: value.storyPoints,
        rowVersion: task.rowVersion,
      },
      () => this.goBack(),
    );
  }

  goBack(): void {
    this.router.navigate(['/tasks/board'], { queryParams: { task: this.taskId() } });
  }
}
