import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationApiService } from '@features/notifications/services/notification-api.service';
import { NotificationStore } from '@features/notifications/stores/notification.store';
import { NotificationService } from '@core/services/notification.service';
import { NotificationType } from '@features/notifications/models/notification.enums';

describe('NotificationStore', () => {
  let store: NotificationStore;
  let api: jasmine.SpyObj<NotificationApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<NotificationApiService>('NotificationApiService', [
      'list',
      'getCount',
      'markRead',
      'markAllRead',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        NotificationStore,
        { provide: NotificationApiService, useValue: api },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']),
        },
      ],
    });

    store = TestBed.inject(NotificationStore);
  });

  it('should load notifications', () => {
    api.list.and.returnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }),
    );

    store.loadInitial();
    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });

  it('should update unread count', () => {
    store.setUnreadCount(3);
    expect(store.unreadCount()).toBe(3);
  });

  it('should mark notification as read', () => {
    const item = {
      id: 'n1',
      userId: 'u1',
      type: NotificationType.TaskAssigned,
      title: 'Assigned',
      message: 'Task assigned',
      referenceType: 'Task',
      referenceId: 't1',
      isRead: false,
      readAt: null,
      createdAt: '2026-06-23T10:00:00Z',
    };

    api.markRead.and.returnValue(of({ ...item, isRead: true, readAt: '2026-06-23T11:00:00Z' }));
    store.setUnreadCount(1);
    store.markRead('n1');
    expect(api.markRead).toHaveBeenCalledWith('n1');
  });
});
