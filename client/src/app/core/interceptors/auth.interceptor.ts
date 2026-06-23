import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';

/** Placeholder auth interceptor — logs outbound API calls without auth logic. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  if (req.url.includes('/api/')) {
    logger.debug('HTTP request', {
      method: req.method,
      url: req.url,
    });
  }

  return next(req);
};
