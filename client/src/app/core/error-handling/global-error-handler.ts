import { ErrorHandler, inject, Injectable } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown application error';
    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error('Unhandled application error', { message, stack });
  }
}
