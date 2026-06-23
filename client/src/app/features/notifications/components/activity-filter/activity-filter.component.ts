import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ActivityEntityFilter,
  ActivityScope,
} from '@features/notifications/models/notification.enums';
import type { ActivityFilters } from '@features/notifications/models/activity.models';
import { ActivityStore } from '@features/notifications/stores/activity.store';

@Component({
  selector: 'app-activity-filter',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <form class="activity-filter" [formGroup]="form" (ngSubmit)="apply()">
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput formControlName="keyword" placeholder="Search activity" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Scope</mat-label>
        <mat-select formControlName="scope">
          <mat-option [value]="scopes.All">All activity</mat-option>
          <mat-option [value]="scopes.Personal">Personal</mat-option>
          <mat-option [value]="scopes.Project">Project</mat-option>
          <mat-option [value]="scopes.Organization">Organization</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Entity</mat-label>
        <mat-select formControlName="entityType">
          <mat-option [value]="entityFilters.All">All entities</mat-option>
          <mat-option [value]="entityFilters.Task">Tasks</mat-option>
          <mat-option [value]="entityFilters.Project">Projects</mat-option>
          <mat-option [value]="entityFilters.Organization">Organizations</mat-option>
          <mat-option [value]="entityFilters.Comment">Comments</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Project ID</mat-label>
        <input matInput formControlName="projectId" placeholder="Optional project scope" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>From</mat-label>
        <input matInput type="date" formControlName="createdFrom" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>To</mat-label>
        <input matInput type="date" formControlName="createdTo" />
      </mat-form-field>

      <div class="activity-filter__actions">
        <button mat-button type="button" (click)="reset()">Reset</button>
        <button mat-flat-button color="primary" type="submit">Apply</button>
      </div>
    </form>
  `,
  styles: `
    .activity-filter {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.75rem;
      align-items: end;
    }

    .activity-filter__actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      grid-column: 1 / -1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFilterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ActivityStore);

  readonly scopes = ActivityScope;
  readonly entityFilters = ActivityEntityFilter;
  readonly filtersVisible = signal(true);

  readonly form = this.fb.nonNullable.group({
    keyword: '',
    scope: ActivityScope.All,
    entityType: ActivityEntityFilter.All,
    projectId: '',
    createdFrom: '',
    createdTo: '',
    sortDescending: true,
  });

  apply(): void {
    const value = this.form.getRawValue();
    this.store.setFilters(this.toFilters(value));
  }

  reset(): void {
    this.store.resetFilters();
    this.form.reset({
      keyword: '',
      scope: ActivityScope.All,
      entityType: ActivityEntityFilter.All,
      projectId: '',
      createdFrom: '',
      createdTo: '',
      sortDescending: true,
    });
  }

  private toFilters(value: ReturnType<typeof this.form.getRawValue>): Partial<ActivityFilters> {
    return {
      keyword: value.keyword,
      scope: value.scope,
      entityType: value.entityType,
      projectId: value.projectId || null,
      createdFrom: value.createdFrom || null,
      createdTo: value.createdTo || null,
      sortDescending: value.sortDescending,
    };
  }
}
