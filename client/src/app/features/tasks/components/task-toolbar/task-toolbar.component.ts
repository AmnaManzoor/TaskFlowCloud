import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TaskFilterComponent } from '@features/tasks/components/task-filter/task-filter.component';
import type { TaskFilters } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-toolbar',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    TaskFilterComponent,
  ],
  template: `
    <div class="task-toolbar">
      <div class="task-toolbar__search">
        <mat-form-field appearance="outline" class="task-toolbar__search-field">
          <mat-label>Search tasks</mat-label>
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input
            matInput
            [ngModel]="search()"
            (ngModelChange)="searchChange.emit($event)"
            placeholder="Title, description..."
          />
        </mat-form-field>
      </div>

      <nav class="task-toolbar__views" aria-label="Task views">
        <a mat-stroked-button routerLink="/tasks/board" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <mat-icon>view_kanban</mat-icon>
          Board
        </a>
        <a mat-stroked-button routerLink="/tasks/list" routerLinkActive="active">
          <mat-icon>table_rows</mat-icon>
          List
        </a>
        <a mat-stroked-button routerLink="/tasks/calendar" routerLinkActive="active">
          <mat-icon>calendar_month</mat-icon>
          Calendar
        </a>
      </nav>
    </div>

    @if (showFilters()) {
      <app-task-filter
        [filters]="filters()"
        [projects]="projects()"
        (filtersChange)="filtersChange.emit($event)"
      />
    }
  `,
  styles: `
    .task-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .task-toolbar__search {
      flex: 1;
      min-width: 14rem;
    }

    .task-toolbar__search-field {
      width: 100%;
    }

    .task-toolbar__views {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .task-toolbar__views a.active {
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      border-color: var(--mat-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskToolbarComponent {
  readonly search = input('');
  readonly filters = input.required<TaskFilters>();
  readonly projects = input<{ id: string; name: string }[]>([]);
  readonly showFilters = input(true);
  readonly searchChange = output<string>();
  readonly filtersChange = output<Partial<TaskFilters>>();
}
