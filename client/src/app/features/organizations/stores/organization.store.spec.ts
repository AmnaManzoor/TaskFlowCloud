import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrganizationService } from '@features/organizations/services/organization.service';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { AuthStore } from '@core/stores/auth.store';

describe('OrganizationStore', () => {
  let store: OrganizationStore;
  let organizationService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    organizationService = jasmine.createSpyObj<OrganizationService>('OrganizationService', ['list']);

    TestBed.configureTestingModule({
      providers: [
        OrganizationStore,
        AuthStore,
        { provide: OrganizationService, useValue: organizationService },
      ],
    });

    store = TestBed.inject(OrganizationStore);
  });

  it('should load organizations', () => {
    organizationService.list.and.returnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }),
    );

    store.loadList();

    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });
});
