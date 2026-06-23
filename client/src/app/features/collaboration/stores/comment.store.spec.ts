import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommentApiService } from '@features/collaboration/services/comment-api.service';
import { CommentStore } from '@features/collaboration/stores/comment.store';
import { NotificationService } from '@core/services/notification.service';

describe('CommentStore', () => {
  let store: CommentStore;
  let commentApi: jasmine.SpyObj<CommentApiService>;

  beforeEach(() => {
    commentApi = jasmine.createSpyObj<CommentApiService>('CommentApiService', ['listByTask', 'create']);

    TestBed.configureTestingModule({
      providers: [
        CommentStore,
        { provide: CommentApiService, useValue: commentApi },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
      ],
    });

    store = TestBed.inject(CommentStore);
  });

  it('should load comments for a task', () => {
    commentApi.listByTask.and.returnValue(
      of({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 }),
    );

    store.loadForTask('task-1');
    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });
});
