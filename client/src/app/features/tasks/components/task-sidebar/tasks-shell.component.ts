import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TaskDetailsPanelComponent } from '@features/tasks/components/task-details-panel/task-details-panel.component';
import { TaskToolbarComponent } from '@features/tasks/components/task-toolbar/task-toolbar.component';
import {
  AddLabelDialogComponent,
  type AddLabelDialogResult,
} from '@features/tasks/dialogs/add-label-dialog.component';
import {
  AssignUsersDialogComponent,
  type AssignUsersDialogResult,
} from '@features/tasks/dialogs/assign-users-dialog.component';
import {
  ChangeStatusDialogComponent,
  type ChangeStatusDialogResult,
} from '@features/tasks/dialogs/change-status-dialog.component';
import { DeleteTaskDialogComponent } from '@features/tasks/dialogs/delete-task-dialog.component';
import {
  MoveTaskDialogComponent,
  type MoveTaskDialogResult,
} from '@features/tasks/dialogs/move-task-dialog.component';
import { ProjectStore } from '@features/projects/stores/project.store';
import { UserStore } from '@features/organizations/stores/user.store';
import { TaskStore } from '@features/tasks/stores/task.store';
import { AuthStore } from '@core/stores/auth.store';
import {
  canAssignTask,
  canCreateTask,
  canDeleteTask,
  canManageTask,
} from '@features/tasks/utils/task-permissions.util';

@Component({
  selector: 'app-tasks-shell',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatButtonModule,
    PageHeaderComponent,
    TaskToolbarComponent,
    TaskDetailsPanelComponent,
  ],
  template: `
    <mat-sidenav-container class="tasks-shell">
      <mat-sidenav-content>
        <app-page-header title="Tasks" subtitle="Manage work across projects with board, list, and calendar views">
          @if (canCreate()) {
            <button actions mat-flat-button type="button" (click)="router.navigate(['/tasks/new'])">
              Create task
            </button>
          }
        </app-page-header>

        <app-task-toolbar
          [search]="store.search()"
          [filters]="store.filters()"
          [projects]="projects()"
          (searchChange)="store.setSearch($event)"
          (filtersChange)="store.setFilters($event)"
        />

        <router-outlet />
      </mat-sidenav-content>

      <mat-sidenav
        #drawer
        class="tasks-shell__drawer"
        position="end"
        mode="over"
        [opened]="!!selectedTaskId()"
        (closedStart)="closeDrawer()"
      >
        <app-task-details-panel
          [task]="store.selected()"
          [loading]="store.detailLoading()"
          [error]="store.error()"
          [canEdit]="canManage()"
          [canDelete]="canDelete()"
          (close)="closeDrawer()"
          (edit)="editTask()"
          (delete)="confirmDelete()"
          (changeStatus)="changeStatus()"
          (move)="moveTask()"
          (retry)="reloadTask()"
          (manageAssignees)="assignUsers()"
          (addLabel)="addLabel()"
          (removeLabel)="removeLabel($event)"
          (addChecklistItem)="addChecklistItem($event)"
          (updateChecklistItem)="updateChecklistItem($event)"
          (deleteChecklistItem)="deleteChecklistItem($event)"
        />
      </mat-sidenav>
    </mat-sidenav-container>
  `,
  styles: `
    .tasks-shell {
      min-height: calc(100vh - 8rem);
      background: transparent;
    }

    .tasks-shell__drawer {
      width: min(32rem, 100vw);
      padding: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksShellComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly projectStore = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly drawer = viewChild<MatSidenav>('drawer');
  readonly selectedTaskId = signal<string | null>(null);

  ngOnInit(): void {
    this.projectStore.loadList();
    this.projectStore.loadCreatableProjects();
    this.userStore.loadList();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const taskId = params.get('task');
      const projectId = params.get('projectId');
      if (projectId) {
        this.store.setProjectFilter(projectId);
      }
      this.selectedTaskId.set(taskId);
      if (taskId) {
        this.store.loadById(taskId);
        this.store.loadActivity(taskId);
      } else {
        this.store.clearSelected();
      }
    });
  }

  projects() {
    return this.projectStore.items().map((project) => ({ id: project.id, name: project.name }));
  }

  canCreate() {
    return canCreateTask(this.authStore.roles(), this.projectStore.creatableProjects().length);
  }

  canManage() {
    return canManageTask(this.authStore.roles());
  }

  canDelete() {
    return canDeleteTask(this.authStore.roles());
  }

  closeDrawer(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { task: null },
      queryParamsHandling: 'merge',
    });
  }

  editTask(): void {
    const task = this.store.selected();
    if (task) {
      this.router.navigate(['/tasks', task.id, 'edit']);
    }
  }

  reloadTask(): void {
    const id = this.selectedTaskId();
    if (id) {
      this.store.loadById(id);
    }
  }

  confirmDelete(): void {
    const task = this.store.selected();
    if (!task) return;

    this.dialog
      .open(DeleteTaskDialogComponent, { data: { title: task.title } })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.delete(task.id, () => this.closeDrawer());
        }
      });
  }

  changeStatus(): void {
    const task = this.store.selected();
    if (!task) return;

    this.dialog
      .open(ChangeStatusDialogComponent, { data: { currentStatus: task.status } })
      .afterClosed()
      .subscribe((result: ChangeStatusDialogResult | undefined) => {
        if (result) {
          this.store.changeStatus(task.id, result.status, () => {
            this.store.loadById(task.id);
            this.store.loadActivity(task.id);
          });
        }
      });
  }

  moveTask(): void {
    const task = this.store.selected();
    if (!task) return;

    this.dialog
      .open(MoveTaskDialogComponent, {
        data: {
          projects: this.projects(),
          currentProjectId: task.projectId,
        },
      })
      .afterClosed()
      .subscribe((result: MoveTaskDialogResult | undefined) => {
        if (result) {
          this.store.moveTask(task.id, result.targetProjectId);
        }
      });
  }

  assignUsers(): void {
    if (!canAssignTask(this.authStore.roles())) return;
    const task = this.store.selected();
    if (!task) return;

    const users = this.userStore.items().map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName}`.trim() || user.email,
    }));

    this.dialog
      .open(AssignUsersDialogComponent, {
        data: {
          users,
          selectedIds: (task.assignees ?? []).map((assignee) => assignee.userId),
        },
      })
      .afterClosed()
      .subscribe((result: AssignUsersDialogResult | undefined) => {
        if (result) {
          this.store.assignUsers(task.id, result.userIds);
        }
      });
  }

  addLabel(): void {
    const task = this.store.selected();
    if (!task) return;

    this.dialog
      .open(AddLabelDialogComponent)
      .afterClosed()
      .subscribe((result: AddLabelDialogResult | undefined) => {
        if (result) {
          this.store.addLabel(task.id, { name: result.name, color: result.color });
        }
      });
  }

  removeLabel(labelId: string): void {
    const task = this.store.selected();
    if (task) {
      this.store.removeLabel(task.id, labelId);
    }
  }

  addChecklistItem(title: string): void {
    const task = this.store.selected();
    if (task) {
      this.store.createChecklist(task.id, { title, order: (task.checklists?.length ?? 0) + 1 });
    }
  }

  updateChecklistItem(payload: {
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
  }): void {
    const task = this.store.selected();
    if (task) {
      this.store.updateChecklist(task.id, payload.id, payload);
      this.store.loadActivity(task.id);
    }
  }

  deleteChecklistItem(checklistId: string): void {
    const task = this.store.selected();
    if (task) {
      this.store.removeChecklist(task.id, checklistId);
    }
  }
}
