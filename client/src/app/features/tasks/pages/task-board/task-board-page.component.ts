import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { KanbanBoardComponent } from '@features/tasks/components/kanban-board/kanban-board.component';
import { TaskStore } from '@features/tasks/stores/task.store';
import { AuthStore } from '@core/stores/auth.store';
import { canDeleteTask, canManageTask } from '@features/tasks/utils/task-permissions.util';
import { MatDialog } from '@angular/material/dialog';
import { DeleteTaskDialogComponent } from '@features/tasks/dialogs/delete-task-dialog.component';
import { TaskStatus } from '@features/tasks/models/task.enums';

@Component({
  selector: 'app-task-board-page',
  imports: [
    KanbanBoardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    WidgetErrorComponent,
    MatButtonModule,
  ],
  template: `
    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="store.loadBoard()" />
    } @else if (store.boardLoading()) {
      <app-skeleton-loader [rows]="4" [height]="180" />
    } @else if (store.boardItems().length === 0) {
      <app-empty-state
        icon="view_kanban"
        title="No tasks on the board"
        description="Create a task or adjust your filters to get started."
      />
    } @else {
      <app-kanban-board
        [canEdit]="canManage()"
        [canDelete]="canDelete()"
        (statusChange)="onStatusChange($event)"
        (openTask)="openTask($event)"
        (editTask)="editTask($event)"
        (deleteTask)="confirmDelete($event)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardPageComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.store.setViewMode('board');
    this.store.loadBoard();
  }

  canManage() {
    return canManageTask(this.authStore.roles());
  }

  canDelete() {
    return canDeleteTask(this.authStore.roles());
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

  onStatusChange(event: { taskId: string; status: TaskStatus }): void {
    this.store.changeStatus(event.taskId, event.status, () => this.store.loadBoard());
  }

  confirmDelete(taskId: string): void {
    const task = this.store.boardItems().find((item) => item.id === taskId);
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
