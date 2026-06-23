import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TaskApiService } from '@features/tasks/services/task-api.service';
import { TaskService } from '@features/tasks/services/task.service';
import { TaskStore } from '@features/tasks/stores/task.store';
import { NotificationService } from '@core/services/notification.service';

describe('TaskStore', () => {
  let store: TaskStore;
  let taskService: jasmine.SpyObj<TaskService>;

  beforeEach(() => {
    taskService = jasmine.createSpyObj<TaskService>('TaskService', ['loadTasks', 'loadBoardTasks']);

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: taskService },
        { provide: TaskApiService, useValue: jasmine.createSpyObj('TaskApiService', ['getById']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success']) },
      ],
    });

    store = TestBed.inject(TaskStore);
  });

  it('should load tasks', () => {
    taskService.loadTasks.and.returnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }),
    );

    store.loadList();

    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });

  it('should load board tasks', () => {
    taskService.loadBoardTasks.and.returnValue(
      of({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 }),
    );

    store.loadBoard();

    expect(store.boardLoading()).toBeFalse();
    expect(store.boardItems()).toEqual([]);
  });
});
