import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProjectApiService } from '@features/projects/services/project-api.service';
import { ProjectService } from '@features/projects/services/project.service';
import { ProjectStore } from '@features/projects/stores/project.store';
import { AuthStore } from '@core/stores/auth.store';

describe('ProjectStore', () => {
  let store: ProjectStore;
  let projectService: jasmine.SpyObj<ProjectService>;

  beforeEach(() => {
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['loadProjects']);

    TestBed.configureTestingModule({
      providers: [
        ProjectStore,
        AuthStore,
        { provide: ProjectService, useValue: projectService },
        { provide: ProjectApiService, useValue: jasmine.createSpyObj('ProjectApiService', ['listMembers']) },
      ],
    });

    store = TestBed.inject(ProjectStore);
  });

  it('should load projects', () => {
    projectService.loadProjects.and.returnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }),
    );

    store.loadList();

    expect(store.loading()).toBeFalse();
    expect(store.items()).toEqual([]);
  });
});
