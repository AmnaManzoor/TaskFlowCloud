import { HttpErrorResponse } from '@angular/common/http';
import type { ProblemDetails } from '@core/authentication/models/auth.models';

export function extractApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Check your network connection.';
  }

  const body = error.error as ProblemDetails | string | null | undefined;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    if (body.detail) {
      return body.detail;
    }

    if (body.title) {
      return body.title;
    }

    if (body.errors) {
      const messages = Object.values(body.errors).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }

  return fallback;
}
