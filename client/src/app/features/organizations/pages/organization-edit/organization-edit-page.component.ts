import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { AuthStore } from '@core/stores/auth.store';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { canManageOrganization } from '@features/organizations/utils/permissions.util';

@Component({
  selector: 'app-organization-edit-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    LoadingButtonComponent,
  ],
  template: `
    @if (canManage()) {
      <form class="org-form" [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="org-form__field">
          <mat-label>Organization name</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline" class="org-form__field">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="org-form__field">
          <mat-label>Logo URL</mat-label>
          <input matInput formControlName="logoUrl" />
        </mat-form-field>
        <mat-checkbox formControlName="isActive">Organization is active</mat-checkbox>

        <div class="org-form__actions">
          <button mat-button type="button" color="warn" (click)="confirmDelete()">Delete</button>
          <app-loading-button type="submit" [loading]="store.saving()" label="Save changes" />
        </div>
      </form>
    } @else {
      <p>You do not have permission to edit this organization.</p>
    }
  `,
  styles: `
    .org-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 36rem;
    }

    .org-form__field {
      width: 100%;
    }

    .org-form__actions {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationEditPageComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(OrganizationStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    logoUrl: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const org = this.store.selected();
    if (org) {
      this.form.patchValue({
        name: org.name,
        description: org.description ?? '',
        logoUrl: org.logoUrl ?? '',
        isActive: org.isActive,
      });
    }
  }

  canManage(): boolean {
    return canManageOrganization(this.authStore.roles(), this.store.currentMemberRole());
  }

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.update(this.organizationId(), value);
  }

  confirmDelete(): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Delete organization',
          message: 'This action cannot be undone. The organization will be permanently deleted.',
          confirmLabel: 'Delete',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.delete(this.organizationId(), () => void this.router.navigate(['/organizations']));
        }
      });
  }
}
