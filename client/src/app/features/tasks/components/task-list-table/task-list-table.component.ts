import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TaskAssigneesComponent } from '@features/tasks/components/task-assignees/task-assignees.component';
import { TaskLabelChipComponent } from '@features/tasks/components/task-labels/task-label-chip.component';
import { TaskPriorityComponent } from '@features/tasks/components/task-priority/task-priority.component';
import { TaskStatusComponent } from '@features/tasks/components/task-status/task-status.component';
import type { Task } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-list-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TaskStatusComponent,
    TaskPriorityComponent,
    TaskAssigneesComponent,
    TaskLabelChipComponent,
  ],
  template: `
    <div class="task-table-wrap">
      <table mat-table [dataSource]="data()" matSort (matSortChange)="sortChange.emit($event)" class="task-table">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
          <td mat-cell *matCellDef="let row">
            <button type="button" class="task-table__link" (click)="open.emit(row.id)">{{ row.title }}</button>
          </td>
        </ng-container>

        <ng-container matColumnDef="project">
          <th mat-header-cell *matHeaderCellDef>Project</th>
          <td mat-cell *matCellDef="let row">{{ projectName(row.projectId) }}</td>
        </ng-container>

        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
          <td mat-cell *matCellDef="let row"><app-task-priority [priority]="row.priority" /></td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let row"><app-task-status [status]="row.status" /></td>
        </ng-container>

        <ng-container matColumnDef="assignee">
          <th mat-header-cell *matHeaderCellDef>Assignee</th>
          <td mat-cell *matCellDef="let row">
            <app-task-assignees [assignees]="row.assignees ?? []" [maxVisible]="2" />
          </td>
        </ng-container>

        <ng-container matColumnDef="dueDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Due date</th>
          <td mat-cell *matCellDef="let row">{{ row.dueDate ? (row.dueDate | date: 'mediumDate') : '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="estimatedHours">
          <th mat-header-cell *matHeaderCellDef>Est. hours</th>
          <td mat-cell *matCellDef="let row">{{ row.estimatedHours ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="actualHours">
          <th mat-header-cell *matHeaderCellDef>Actual hours</th>
          <td mat-cell *matCellDef="let row">{{ row.actualHours ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="labels">
          <th mat-header-cell *matHeaderCellDef>Labels</th>
          <td mat-cell *matCellDef="let row">
            <div class="task-table__labels">
              @for (label of row.labels ?? []; track label.id) {
                <app-task-label-chip [name]="label.name" [color]="label.color" />
              }
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button type="button" [matMenuTriggerFor]="menu" aria-label="Task actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item type="button" (click)="open.emit(row.id)">Open</button>
              @if (canEdit()) {
                <button mat-menu-item type="button" (click)="edit.emit(row.id)">Edit</button>
              }
              @if (canDelete()) {
                <button mat-menu-item type="button" (click)="delete.emit(row.id)">Delete</button>
              }
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns" class="task-table__row"></tr>
      </table>
    </div>
  `,
  styles: `
    .task-table-wrap {
      overflow: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.75rem;
    }

    .task-table {
      width: 100%;
      min-width: 56rem;
    }

    .task-table__link {
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      color: var(--mat-sys-primary);
      cursor: pointer;
      text-align: left;
    }

    .task-table__labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .task-table__row:hover {
      background: var(--mat-sys-surface-container-low);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListTableComponent {
  readonly data = input<Task[]>([]);
  readonly projectNames = input<Record<string, string>>({});
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly sortChange = output<Sort>();
  readonly open = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  readonly displayedColumns = [
    'title',
    'project',
    'priority',
    'status',
    'assignee',
    'dueDate',
    'estimatedHours',
    'actualHours',
    'labels',
    'actions',
  ];

  projectName(projectId: string) {
    return this.projectNames()[projectId] ?? projectId.slice(0, 8);
  }
}
