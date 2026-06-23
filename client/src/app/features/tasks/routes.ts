import { Routes } from '@angular/router';

export const TASK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/tasks/components/task-sidebar/tasks-shell.component').then(
        (m) => m.TasksShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'board' },
      {
        path: 'board',
        loadComponent: () =>
          import('@features/tasks/pages/task-board/task-board-page.component').then(
            (m) => m.TaskBoardPageComponent,
          ),
        title: 'Task board',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('@features/tasks/pages/task-list/task-list-page.component').then(
            (m) => m.TaskListPageComponent,
          ),
        title: 'Task list',
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('@features/tasks/pages/task-calendar/task-calendar-page.component').then(
            (m) => m.TaskCalendarPageComponent,
          ),
        title: 'Task calendar',
      },
    ],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('@features/tasks/pages/task-create/task-create-page.component').then(
        (m) => m.TaskCreatePageComponent,
      ),
    title: 'Create task',
  },
  {
    path: ':taskId/edit',
    loadComponent: () =>
      import('@features/tasks/pages/task-edit/task-edit-page.component').then(
        (m) => m.TaskEditPageComponent,
      ),
    title: 'Edit task',
  },
];
