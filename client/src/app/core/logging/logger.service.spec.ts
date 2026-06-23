import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/logging/logger.service';
import { APP_CONFIG } from '@core/config/app-config.token';
import { environment } from '@env/environment';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: environment }],
    });

    logger = TestBed.inject(LoggerService);
  });

  it('should log info messages when level allows', () => {
    spyOn(console, 'info');
    logger.info('Test message');
    expect(console.info).toHaveBeenCalled();
  });
});
