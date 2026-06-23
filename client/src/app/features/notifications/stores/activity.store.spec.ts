import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStore } from '@core/authentication/stores/auth.store';
import { ActivityApiService } from '@features/notifications/services/activity-api.service';
import { ActivityStore } from '@features/notifications/stores/activity.store';
import { NotificationService } from '@core/services/notification.service';

describe('ActivityStore', () => {
  let store: ActivityStore;
  let api: jasmine.SpyObj<ActivityApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ActivityApiService>('ActivityApiService', ['list']);

    TestBed.configureTestingModule({
      providers: [
        ActivityStore,
        { provide: ActivityApiService, useValue: api },
        {
          provide: AuthStore,
          useValue: { user: () => ({ id: 'user-1' }) },
        },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']),
        },
      ],
    });

    store = TestBed.inject(ActivityStore);
  });

  it('should load activity', () => {
    api.list.and.returnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }),
    );

    store.loadInitial();
    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });
});
