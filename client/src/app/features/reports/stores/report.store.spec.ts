import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ReportApiService } from '@features/reports/services/report-api.service';
import { AnalyticsService } from '@features/reports/services/analytics.service';
import { ReportStore } from '@features/reports/stores/report.store';
import { ReportType, ExportStatus } from '@features/reports/models/report.enums';

describe('ReportStore', () => {
  let store: ReportStore;
  let api: jasmine.SpyObj<ReportApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ReportApiService>('ReportApiService', ['getTaskReport']);

    TestBed.configureTestingModule({
      providers: [
        ReportStore,
        { provide: ReportApiService, useValue: api },
        {
          provide: AnalyticsService,
          useValue: {
            exportStatus: signal(ExportStatus.Idle),
            exportProgress: signal(0),
            exportTable: jasmine.createSpy('exportTable'),
          },
        },
      ],
    });

    store = TestBed.inject(ReportStore);
  });

  it('should load task report', () => {
    api.getTaskReport.and.returnValue(
      of({
        summary: { totalCount: 0, breakdown: {} },
        statusChart: { chartType: 'bar', items: [] },
        priorityChart: { chartType: 'pie', items: [] },
        typeChart: { chartType: 'pie', items: [] },
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
      }),
    );

    store.loadReport(ReportType.Tasks);
    expect(store.loading()).toBeFalse();
  });
});
