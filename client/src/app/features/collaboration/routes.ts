import { Routes } from '@angular/router';

export const COLLABORATION_ROUTES: Routes = [
  {
    path: 'tasks/:taskId/comments',
    loadComponent: () =>
      import('@features/collaboration/pages/task-comments/task-comments-page.component').then(
        (m) => m.TaskCommentsPageComponent,
      ),
    title: 'Task comments',
  },
  {
    path: 'tasks/:taskId/attachments',
    loadComponent: () =>
      import('@features/collaboration/pages/task-attachments/task-attachments-page.component').then(
        (m) => m.TaskAttachmentsPageComponent,
      ),
    title: 'Task attachments',
  },
];
