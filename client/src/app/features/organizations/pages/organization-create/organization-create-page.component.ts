import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';

@Component({
  selector: 'app-organization-create-page',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    BreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LoadingButtonComponent,
  ],
  template: `
    <app-breadcrumb [items]="breadcrumbs" />
    <app-page-header title="Create organization" subtitle="Set up a new workspace for your team" />

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

      <div class="org-form__actions">
        <button mat-button type="button" (click)="router.navigate(['/organizations'])">Cancel</button>
        <app-loading-button type="submit" [loading]="store.saving()" label="Create organization" />
      </div>
    </form>
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
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCreatePageComponent implements OnInit {
  readonly store = inject(OrganizationStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly breadcrumbs = [
    { label: 'Organizations', route: '/organizations' },
    { label: 'Create' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    logoUrl: [''],
  });

  ngOnInit(): void {
    this.store.clearError();
  }

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.create(
      {
        name: value.name,
        description: value.description || null,
        logoUrl: value.logoUrl || null,
      },
      (org) => void this.router.navigate(['/organizations', org.id]),
    );
  }
}
