import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { ProjectPriorityComponent } from '@features/projects/components/project-priority/project-priority.component';
import { ProjectProgressComponent } from '@features/projects/components/project-progress/project-progress.component';
import { ProjectStatusComponent } from '@features/projects/components/project-status/project-status.component';
import type { Project } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ProjectStatusComponent,
    ProjectPriorityComponent,
    ProjectProgressComponent,
    DatePipe,
  ],
  template: `
    <table mat-table [dataSource]="data()" matSort (matSortChange)="sortChange.emit($event)" class="project-table">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let row">
          <a [routerLink]="['/projects', row.id]" class="project-table__link">{{ row.name }}</a>
          <div class="project-table__code">{{ row.code }}</div>
        </td>
      </ng-container>

      <ng-container matColumnDef="organization">
        <th mat-header-cell *matHeaderCellDef>Organization</th>
        <td mat-cell *matCellDef="let row">{{ orgName(row) }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
        <td mat-cell *matCellDef="let row"><app-project-status [status]="row.status" /></td>
      </ng-container>

      <ng-container matColumnDef="priority">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
        <td mat-cell *matCellDef="let row"><app-project-priority [priority]="row.priority" /></td>
      </ng-container>

      <ng-container matColumnDef="progress">
        <th mat-header-cell *matHeaderCellDef>Progress</th>
        <td mat-cell *matCellDef="let row"><app-project-progress [project]="row" /></td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
        <td mat-cell *matCellDef="let row">{{ row.createdAt | date: 'mediumDate' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let row">
          <a mat-icon-button [routerLink]="['/projects', row.id]" aria-label="View project">
            <mat-icon>visibility</mat-icon>
          </a>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  `,
  styles: `
    .project-table {
      width: 100%;
    }

    .project-table__link {
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .project-table__code {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTableComponent {
  readonly data = input<Project[]>([]);
  readonly organizationNames = input<Record<string, string>>({});
  readonly sortChange = output<Sort>();

  readonly columns = ['name', 'organization', 'status', 'priority', 'progress', 'createdAt', 'actions'];

  orgName(project: Project): string {
    return (
      project.summary?.organizationName ??
      this.organizationNames()[project.organizationId] ??
      project.organizationId.slice(0, 8)
    );
  }
}
