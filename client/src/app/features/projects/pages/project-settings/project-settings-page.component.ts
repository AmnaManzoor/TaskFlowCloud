import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { ProjectFormComponent } from '@features/projects/components/project-form/project-form.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { TransferOwnerDialogComponent } from '@features/projects/dialogs/transfer-owner-dialog.component';
import { AuthStore } from '@core/stores/auth.store';
import { ProjectStore } from '@features/projects/stores/project.store';
import { ProjectPriority, ProjectStatus } from '@features/projects/models/project.enums';
import {
  canDeleteOrArchiveProject,
  canManageProject,
  canTransferOwnership,
} from '@features/projects/utils/project-permissions.util';
import { projectPriorityLabel, projectStatusLabel } from '@features/projects/models/project.utils';

@Component({
  selector: 'app-project-settings-page',
  imports: [
    ReactiveFormsModule,
    ProjectFormComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    LoadingButtonComponent,
  ],
  template: `
    @if (canManage()) {
      <form (ngSubmit)="saveDetails()">
        <app-project-form
          [form]="detailsForm"
          [showOrganization]="false"
          [showCode]="false"
          [showStatusPriority]="false"
        />
        <div class="settings-actions">
          <app-loading-button type="submit" [loading]="store.saving()" label="Save details" />
        </div>
      </form>

      <section class="settings-section">
        <h2>Status & priority</h2>
        <div class="settings-row">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [value]="store.selected()?.status" (valueChange)="store.changeStatus(projectId(), $event)">
              @for (status of statuses; track status) {
                <mat-option [value]="status">{{ projectStatusLabel(status) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select [value]="store.selected()?.priority" (valueChange)="store.changePriority(projectId(), $event)">
              @for (priority of priorities; track priority) {
                <mat-option [value]="priority">{{ projectPriorityLabel(priority) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </section>

      <section class="settings-section settings-danger">
        <h2>Lifecycle</h2>
        <div class="settings-row">
          @if (store.selected()?.isArchived) {
            <button mat-stroked-button type="button" (click)="store.restore(projectId())">Restore project</button>
          } @else if (canArchive()) {
            <button mat-stroked-button type="button" color="warn" (click)="confirmArchive()">Archive project</button>
          }
          @if (canTransfer()) {
            <button mat-stroked-button type="button" (click)="openTransfer()">Transfer ownership</button>
          }
          @if (canArchive()) {
            <button mat-button type="button" color="warn" (click)="confirmDelete()">Delete project</button>
          }
        </div>
      </section>
    } @else {
      <p>You do not have permission to manage this project.</p>
    }
  `,
  styles: `
    .settings-actions {
      margin-top: 1rem;
    }

    .settings-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .settings-section h2 {
      margin: 0 0 1rem;
      font: var(--mat-sys-title-medium);
    }

    .settings-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .settings-danger {
      border-color: var(--mat-sys-error-container);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsPageComponent {
  readonly projectId = input.required<string>({ alias: 'projectId' });
  readonly store = inject(ProjectStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly statuses = [
    ProjectStatus.Draft,
    ProjectStatus.Active,
    ProjectStatus.OnHold,
    ProjectStatus.Completed,
    ProjectStatus.Cancelled,
    ProjectStatus.Archived,
  ];
  readonly priorities = [
    ProjectPriority.Low,
    ProjectPriority.Medium,
    ProjectPriority.High,
    ProjectPriority.Critical,
  ];
  readonly projectStatusLabel = projectStatusLabel;
  readonly projectPriorityLabel = projectPriorityLabel;

  readonly detailsForm = this.fb.nonNullable.group({
    organizationId: [''],
    name: ['', Validators.required],
    code: [''],
    description: [''],
    status: [ProjectStatus.Draft],
    priority: [ProjectPriority.Medium],
    startDate: [''],
    endDate: [''],
    estimatedCompletionDate: [''],
  });

  constructor() {
    effect(() => {
      const project = this.store.selected();
      if (project) {
        this.patchForm(project);
      }
    });
  }

  patchForm(project: NonNullable<ReturnType<typeof this.store.selected>>): void {
    this.detailsForm.patchValue({
      name: project.name,
      description: project.description ?? '',
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      estimatedCompletionDate: project.estimatedCompletionDate ?? '',
    });
  }

  canManage(): boolean {
    return canManageProject(this.authStore.roles(), this.store.currentUserRole());
  }

  canArchive(): boolean {
    return canDeleteOrArchiveProject(this.authStore.roles(), this.store.currentUserRole());
  }

  canTransfer(): boolean {
    return canTransferOwnership(this.authStore.roles(), this.store.currentUserRole());
  }

  saveDetails(): void {
    const project = this.store.selected();
    if (!project || this.detailsForm.invalid) return;
    const v = this.detailsForm.getRawValue();
    this.store.update(project.id, {
      name: v.name,
      description: v.description || null,
      startDate: v.startDate || null,
      endDate: v.endDate || null,
      estimatedCompletionDate: v.estimatedCompletionDate || null,
      rowVersion: project.rowVersion,
    });
  }

  confirmArchive(): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Archive project',
          message: 'Archived projects are read-only until restored.',
          confirmLabel: 'Archive',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.store.archive(this.projectId()));
  }

  confirmDelete(): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Delete project',
          message: 'This will permanently delete the project.',
          confirmLabel: 'Delete',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.store.delete(this.projectId(), () => void this.router.navigate(['/projects'])));
  }

  openTransfer(): void {
    const members = this.store
      .members()
      .filter((m) => m.userId !== this.store.selected()?.ownerId)
      .map((m) => ({ id: m.userId, label: `${m.firstName} ${m.lastName}` }));

    this.dialog
      .open(TransferOwnerDialogComponent, { data: { members } })
      .afterClosed()
      .subscribe((newOwnerId: string | undefined) => {
        if (newOwnerId) {
          this.store.transferOwner(this.projectId(), newOwnerId);
        }
      });
  }
}
