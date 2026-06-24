import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { TaskFormComponent } from '@features/tasks/components/task-form/task-form.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { TaskStore } from '@features/tasks/stores/task.store';
import { NotificationService } from '@core/services/notification.service';
import { TaskPriority, TaskStatus, TaskType } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-create-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    PageHeaderComponent,
    LoadingButtonComponent,
    TaskFormComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <app-page-header title="Create task" subtitle="Add a new task to a project" />

    @if (projectStore.error()) {
      <app-widget-error [message]="projectStore.error()" (retry)="projectStore.loadCreatableProjects()" />
    } @else if (projectStore.loadingCreatable()) {
      <app-skeleton-loader [rows]="4" />
    } @else if (projects().length === 0) {
      <app-empty-state
        icon="assignment"
        title="No projects available"
        description="You need contributor access or higher in a project, or be an organization owner or administrator."
        actionLabel="Back to tasks"
        (actionClick)="router.navigate(['/tasks/board'])"
      />
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <app-task-form [form]="form" [projects]="projects()" />

        @if (store.error()) {
          <p class="form-error" role="alert">{{ store.error() }}</p>
        }

        <div class="actions">
          <button mat-button type="button" (click)="router.navigate(['/tasks/board'])">Cancel</button>
          <app-loading-button type="submit" [loading]="store.saving()" [disabled]="form.invalid">
            Create task
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

    .form-error {
      margin: 0.75rem 0 0;
      color: var(--mat-sys-error, #b3261e);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreatePageComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly projectStore = inject(ProjectStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

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

  constructor() {
    effect(() => {
      const projects = this.projectStore.creatableProjects();
      const queryProjectId = this.route.snapshot.queryParamMap.get('projectId');
      const currentValue = this.form.controls.projectId.value;

      if (queryProjectId && projects.some((project) => project.id === queryProjectId)) {
        this.form.controls.projectId.setValue(queryProjectId);
        return;
      }

      if (projects.length === 1 && !currentValue) {
        this.form.controls.projectId.setValue(projects[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.projectStore.loadCreatableProjects();
    this.store.clearError();
    this.projectStore.clearError();
  }

  projects() {
    return this.projectStore.creatableProjects().map((project) => ({
      id: project.id,
      name: project.name,
    }));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Please complete all required fields.');
      return;
    }

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
