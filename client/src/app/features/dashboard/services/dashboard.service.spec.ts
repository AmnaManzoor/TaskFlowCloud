import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_CONFIG } from '@core/config/app-config.token';
import { environment } from '@env/environment';
import { DashboardService } from '@features/dashboard/services/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request personal dashboard endpoint', () => {
    service.loadDashboard().subscribe();

    const request = httpMock.expectOne((req) => req.url.includes('/dashboard/me'));
    expect(request.request.method).toBe('GET');
    request.flush({
      assignedTasks: 0,
      overdueTasks: 0,
      completedTasks: 0,
      tasksDueToday: 0,
      tasksDueThisWeek: 0,
      recentProjects: [],
      recentActivity: [],
      recentNotifications: [],
      productivity: {
        completedThisWeek: 0,
        completedThisMonth: 0,
        completedTotal: 0,
        totalEstimatedHours: null,
        totalActualHours: null,
      },
    });

    httpMock.match(() => true).forEach((req) => req.flush({}));
  });
});
