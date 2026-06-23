import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { TaskListTableComponent } from '@features/tasks/components/task-list-table/task-list-table.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { TaskStore } from '@features/tasks/stores/task.store';
import { AuthStore } from '@core/stores/auth.store';
import { canDeleteTask, canManageTask } from '@features/tasks/utils/task-permissions.util';
import { DeleteTaskDialogComponent } from '@features/tasks/dialogs/delete-task-dialog.component';

@Component({
  selector: 'app-task-list-page',
  imports: [
    TaskListTableComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="store.loadList()" />
    } @else if (store.loading()) {
      <app-skeleton-loader [rows]="8" />
    } @else if (store.items().length === 0) {
      <app-empty-state icon="table_rows" title="No tasks found" description="Try adjusting your search or filters." />
    } @else {
      <app-task-list-table
        [data]="store.items()"
        [projectNames]="projectNameMap()"
        [canEdit]="canManage()"
        [canDelete]="canDelete()"
        (sortChange)="onSort($event)"
        (open)="openTask($event)"
        (edit)="editTask($event)"
        (delete)="confirmDelete($event)"
      />
      <app-pagination
        [pageNumber]="store.page()"
        [pageSize]="store.pageSize()"
        [totalCount]="store.totalCount()"
        (pageChange)="store.setPage($event)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPageComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly projectStore = inject(ProjectStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);

  readonly projectNameMap = computed(() => {
    const map: Record<string, string> = {};
    for (const project of this.projectStore.items()) {
      map[project.id] = project.name;
    }
    return map;
  });

  ngOnInit(): void {
    this.store.setViewMode('list');
    this.store.loadList();
  }

  canManage() {
    return canManageTask(this.authStore.roles());
  }

  canDelete() {
    return canDeleteTask(this.authStore.roles());
  }

  onSort(sort: Sort): void {
    this.store.setSort(sort.active, sort.direction === 'desc');
  }

  openTask(taskId: string): void {
    this.router.navigate([], {
      relativeTo: this.route.parent ?? this.route,
      queryParams: { task: taskId },
      queryParamsHandling: 'merge',
    });
  }

  editTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId, 'edit']);
  }

  confirmDelete(taskId: string): void {
    const task = this.store.items().find((item) => item.id === taskId);
    this.dialog
      .open(DeleteTaskDialogComponent, { data: { title: task?.title ?? 'this task' } })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.delete(taskId);
        }
      });
  }
}
