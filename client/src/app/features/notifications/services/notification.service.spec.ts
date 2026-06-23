import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationApiService } from '@features/notifications/services/notification-api.service';
import { NotificationStore } from '@features/notifications/stores/notification.store';
import { NotificationsService } from '@features/notifications/services/notification.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let api: jasmine.SpyObj<NotificationApiService>;
  let store: jasmine.SpyObj<NotificationStore>;

  beforeEach(() => {
    api = jasmine.createSpyObj<NotificationApiService>('NotificationApiService', ['getCount']);
    store = jasmine.createSpyObj<NotificationStore>('NotificationStore', ['setUnreadCount', 'loadDrawerPreview']);

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationApiService, useValue: api },
        { provide: NotificationStore, useValue: store },
      ],
    });

    service = TestBed.inject(NotificationsService);
  });

  it('should refresh unread count', () => {
    api.getCount.and.returnValue(of({ unreadCount: 4 }));
    service.refreshUnreadCount();
    expect(store.setUnreadCount).toHaveBeenCalledWith(4);
  });

  it('should avoid starting polling twice', () => {
    api.getCount.and.returnValue(of({ unreadCount: 1 }));
    service.startPolling();
    service.startPolling();
    expect(api.getCount).toHaveBeenCalledTimes(1);
  });
});
