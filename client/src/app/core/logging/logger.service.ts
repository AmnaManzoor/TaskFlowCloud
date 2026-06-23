import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';
import type { LogLevel, Logger } from '@core/logging/logger.interface';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

@Injectable({ providedIn: 'root' })
export class LoggerService implements Logger {
  private readonly config = inject(APP_CONFIG);

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.logLevel]) {
      return;
    }

    const payload = context ? { ...context } : undefined;
    const prefix = `[TaskFlow:${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, payload);
        break;
      case 'info':
        console.info(prefix, message, payload);
        break;
      case 'warn':
        console.warn(prefix, message, payload);
        break;
      case 'error':
        console.error(prefix, message, payload);
        break;
    }
  }
}
