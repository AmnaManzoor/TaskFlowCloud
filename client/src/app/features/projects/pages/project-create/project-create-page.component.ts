import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { ProjectFormComponent } from '@features/projects/components/project-form/project-form.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { NotificationService } from '@core/services/notification.service';
import { ProjectPriority, ProjectStatus } from '@features/projects/models/project.enums';

@Component({
  selector: 'app-project-create-page',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    BreadcrumbComponent,
    ProjectFormComponent,
    MatButtonModule,
    LoadingButtonComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <app-breadcrumb [items]="breadcrumbs" />
    <app-page-header title="Create project" subtitle="Start a new project in your organization" />

    @if (orgStore.error()) {
      <app-widget-error [message]="orgStore.error()" (retry)="orgStore.loadCreatableOrganizations()" />
    } @else if (orgStore.loadingCreatable()) {
      <app-skeleton-loader [rows]="4" />
    } @else if (organizations().length === 0) {
      <app-empty-state
        icon="domain"
        title="No organizations available"
        description="You need to be an organization owner or administrator to create projects."
        actionLabel="Back to projects"
        (actionClick)="router.navigate(['/projects'])"
      />
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <app-project-form [form]="form" [organizations]="organizations()" />

        @if (store.error()) {
          <p class="form-error" role="alert">{{ store.error() }}</p>
        }

        <div class="form-actions">
          <button mat-button type="button" (click)="router.navigate(['/projects'])">Cancel</button>
          <app-loading-button type="submit" [loading]="store.saving()" [disabled]="form.invalid">
            Create project
          </app-loading-button>
        </div>
      </form>
    }
  `,
  styles: `
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      max-width: 40rem;
    }

    .form-error {
      margin: 0.75rem 0 0;
      color: var(--mat-sys-error, #b3261e);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreatePageComponent implements OnInit {
  readonly store = inject(ProjectStore);
  readonly orgStore = inject(OrganizationStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly breadcrumbs = [
    { label: 'Projects', route: '/projects' },
    { label: 'Create' },
  ];

  readonly form = this.fb.nonNullable.group({
    organizationId: ['', Validators.required],
    name: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    description: [''],
    status: [ProjectStatus.Draft],
    priority: [ProjectPriority.Medium],
    startDate: [''],
    endDate: [''],
    estimatedCompletionDate: [''],
  });

  constructor() {
    effect(() => {
      const organizations = this.orgStore.creatableOrganizations();
      if (organizations.length === 1 && !this.form.controls.organizationId.value) {
        this.form.controls.organizationId.setValue(organizations[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.orgStore.loadCreatableOrganizations();
    this.store.clearError();
    this.orgStore.clearError();
  }

  organizations() {
    return this.orgStore.creatableOrganizations().map((org) => ({ id: org.id, name: org.name }));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Please complete all required fields.');
      return;
    }

    const v = this.form.getRawValue();
    this.store.create(
      {
        organizationId: v.organizationId,
        name: v.name,
        code: v.code.toUpperCase(),
        description: v.description || null,
        status: v.status,
        priority: v.priority,
        startDate: v.startDate || null,
        endDate: v.endDate || null,
        estimatedCompletionDate: v.estimatedCompletionDate || null,
      },
      (project) => void this.router.navigate(['/projects', project.id]),
    );
  }
}
