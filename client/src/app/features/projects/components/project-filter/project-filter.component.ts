import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SearchBoxComponent } from '@shared/components/search-box/search-box.component';
import { TableToolbarComponent } from '@shared/components/table-toolbar/table-toolbar.component';
import { ProjectPriority, ProjectStatus } from '@features/projects/models/project.enums';
import {
  projectPriorityLabel,
  projectStatusLabel,
} from '@features/projects/models/project.utils';
import type { ProjectFilters } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-filter',
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="project-filter">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Organization</mat-label>
        <mat-select [value]="filters().organizationId" (valueChange)="patch({ organizationId: $event })">
          <mat-option [value]="null">All</mat-option>
          @for (org of organizations(); track org.id) {
            <mat-option [value]="org.id">{{ org.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Status</mat-label>
        <mat-select [value]="filters().status" (valueChange)="patch({ status: $event })">
          <mat-option [value]="null">All</mat-option>
          @for (status of statuses; track status) {
            <mat-option [value]="status">{{ projectStatusLabel(status) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Priority</mat-label>
        <mat-select [value]="filters().priority" (valueChange)="patch({ priority: $event })">
          <mat-option [value]="null">All</mat-option>
          @for (priority of priorities; track priority) {
            <mat-option [value]="priority">{{ projectPriorityLabel(priority) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Archived</mat-label>
        <mat-select [value]="filters().isArchived" (valueChange)="patch({ isArchived: $event })">
          <mat-option [value]="null">All</mat-option>
          <mat-option [value]="false">Active only</mat-option>
          <mat-option [value]="true">Archived only</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: `
    .project-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFilterComponent {
  readonly filters = input.required<ProjectFilters>();
  readonly organizations = input<{ id: string; name: string }[]>([]);
  readonly filtersChange = output<Partial<ProjectFilters>>();

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

  patch(patch: Partial<ProjectFilters>): void {
    this.filtersChange.emit(patch);
  }
}
