import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  NotificationCategoryFilter,
  NotificationReadFilter,
  NotificationSortField,
  NotificationType,
} from '@features/notifications/models/notification.enums';
import type { NotificationFilters } from '@features/notifications/models/notification.models';
import { NotificationStore } from '@features/notifications/stores/notification.store';

@Component({
  selector: 'app-notification-filter',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <form class="notification-filter" [formGroup]="form" (ngSubmit)="apply()">
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput formControlName="keyword" placeholder="Search notifications" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select formControlName="read">
          <mat-option [value]="readFilters.All">All</mat-option>
          <mat-option [value]="readFilters.Unread">Unread</mat-option>
          <mat-option [value]="readFilters.Read">Read</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Category</mat-label>
        <mat-select formControlName="category">
          <mat-option [value]="categoryFilters.All">All</mat-option>
          <mat-option [value]="categoryFilters.Mentions">Mentions</mat-option>
          <mat-option [value]="categoryFilters.Tasks">Tasks</mat-option>
          <mat-option [value]="categoryFilters.Projects">Projects</mat-option>
          <mat-option [value]="categoryFilters.Organization">Organization</mat-option>
          <mat-option [value]="categoryFilters.System">System</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Type</mat-label>
        <mat-select formControlName="type">
          <mat-option [value]="null">Any</mat-option>
          @for (type of notificationTypes; track type.value) {
            <mat-option [value]="type.value">{{ type.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>From</mat-label>
        <input matInput type="date" formControlName="createdFrom" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>To</mat-label>
        <input matInput type="date" formControlName="createdTo" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Sort</mat-label>
        <mat-select formControlName="sortBy">
          <mat-option [value]="sortFields.CreatedAt">Date</mat-option>
          <mat-option [value]="sortFields.Type">Type</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="notification-filter__actions">
        <button mat-button type="button" (click)="reset()">Reset</button>
        <button mat-flat-button color="primary" type="submit">Apply</button>
      </div>
    </form>
  `,
  styles: `
    .notification-filter {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.75rem;
      align-items: end;
    }

    .notification-filter__actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      grid-column: 1 / -1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationFilterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(NotificationStore);

  readonly filtersApplied = output<void>();

  readonly readFilters = NotificationReadFilter;
  readonly categoryFilters = NotificationCategoryFilter;
  readonly sortFields = NotificationSortField;

  readonly notificationTypes = Object.entries(NotificationType)
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(),
      value: value as NotificationType,
    }));

  readonly form = this.fb.nonNullable.group({
    keyword: '',
    read: NotificationReadFilter.All,
    category: NotificationCategoryFilter.All,
    type: null as NotificationType | null,
    createdFrom: '',
    createdTo: '',
    sortBy: NotificationSortField.CreatedAt,
    sortDescending: true,
  });

  constructor() {
    const filters = this.store.filters();
    this.form.patchValue({
      keyword: filters.keyword,
      read: filters.read,
      category: filters.category,
      type: filters.type,
      createdFrom: filters.createdFrom ?? '',
      createdTo: filters.createdTo ?? '',
      sortBy: filters.sortBy,
      sortDescending: filters.sortDescending,
    });
  }

  apply(): void {
    const value = this.form.getRawValue();
    this.store.setFilters(this.toFilters(value));
    this.filtersApplied.emit();
  }

  reset(): void {
    this.store.resetFilters();
    this.form.reset({
      keyword: '',
      read: NotificationReadFilter.All,
      category: NotificationCategoryFilter.All,
      type: null,
      createdFrom: '',
      createdTo: '',
      sortBy: NotificationSortField.CreatedAt,
      sortDescending: true,
    });
    this.filtersApplied.emit();
  }

  private toFilters(value: ReturnType<typeof this.form.getRawValue>): Partial<NotificationFilters> {
    return {
      keyword: value.keyword,
      read: value.read,
      category: value.category,
      type: value.type,
      createdFrom: value.createdFrom || null,
      createdTo: value.createdTo || null,
      sortBy: value.sortBy,
      sortDescending: value.sortDescending,
    };
  }
}
