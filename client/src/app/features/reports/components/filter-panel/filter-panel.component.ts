import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskPriority, TaskStatus } from '@features/dashboard/models/dashboard.models';
import { ReportStore } from '@features/reports/stores/report.store';
import { AnalyticsStore } from '@features/reports/stores/analytics.store';

@Component({
  selector: 'app-filter-panel',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <form class="filter-panel" [formGroup]="form" (ngSubmit)="apply()">
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput formControlName="keyword" placeholder="Keyword" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Organization ID</mat-label>
        <input matInput formControlName="organizationId" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Project ID</mat-label>
        <input matInput formControlName="projectId" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>User ID</mat-label>
        <input matInput formControlName="userId" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option [value]="null">Any</mat-option>
          @for (status of taskStatuses; track status.value) {
            <mat-option [value]="status.value">{{ status.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Priority</mat-label>
        <mat-select formControlName="priority">
          <mat-option [value]="null">Any</mat-option>
          @for (priority of taskPriorities; track priority.value) {
            <mat-option [value]="priority.value">{{ priority.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <div class="filter-panel__actions">
        <button mat-button type="button" (click)="reset()">Reset</button>
        <button mat-flat-button color="primary" type="submit">Apply</button>
      </div>
    </form>
  `,
  styles: `
    .filter-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 0.75rem;
      align-items: end;
      margin-bottom: 1rem;
    }
    .filter-panel__actions { grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent {
  private readonly fb = inject(FormBuilder);
  readonly reportStore = inject(ReportStore, { optional: true });
  readonly analyticsStore = inject(AnalyticsStore, { optional: true });

  readonly filtersApplied = output<void>();

  readonly taskStatuses = Object.entries(TaskStatus)
    .filter(([, v]) => typeof v === 'number')
    .map(([label, value]) => ({ label, value: value as TaskStatus }));
  readonly taskPriorities = Object.entries(TaskPriority)
    .filter(([, v]) => typeof v === 'number')
    .map(([label, value]) => ({ label, value: value as TaskPriority }));

  readonly form = this.fb.nonNullable.group({
    keyword: '',
    organizationId: '',
    projectId: '',
    userId: '',
    status: null as TaskStatus | null,
    priority: null as TaskPriority | null,
  });

  apply(): void {
    const value = this.form.getRawValue();
    const filters = {
      keyword: value.keyword,
      organizationId: value.organizationId || undefined,
      projectId: value.projectId || undefined,
      userId: value.userId || undefined,
      status: value.status ?? undefined,
      priority: value.priority ?? undefined,
    };

    if (this.reportStore) {
      this.reportStore.setFilters(filters);
      if (value.organizationId) this.reportStore.setOrganizationId(value.organizationId);
      if (value.projectId) this.reportStore.setProjectId(value.projectId);
    }
    if (this.analyticsStore) {
      this.analyticsStore.setFilters(filters);
      if (value.organizationId) this.analyticsStore.setOrganizationId(value.organizationId);
      if (value.projectId) this.analyticsStore.setProjectId(value.projectId);
    }
    this.filtersApplied.emit();
  }

  reset(): void {
    this.form.reset({
      keyword: '',
      organizationId: '',
      projectId: '',
      userId: '',
      status: null,
      priority: null,
    });
    this.apply();
  }
}
