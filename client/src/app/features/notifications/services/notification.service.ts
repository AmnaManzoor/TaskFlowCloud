import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  Subscription,
  catchError,
  exhaustMap,
  finalize,
  interval,
  of,
  tap,
} from 'rxjs';
import { NotificationApiService } from '@features/notifications/services/notification-api.service';
import { NotificationStore } from '@features/notifications/stores/notification.store';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  POLLING_INTERVAL_MAX_MS,
  POLLING_INTERVAL_MIN_MS,
  type NotificationSettings,
} from '@features/notifications/models/notification.models';

const SETTINGS_STORAGE_KEY = 'taskflow.notification.settings';

/**
 * Coordinates background polling and unread-count refresh.
 * Architecture is intentionally isolated so a future SignalR hub can replace polling here.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(NotificationApiService);
  private readonly store = inject(NotificationStore);

  private pollingSubscription: Subscription | null = null;
  private countRequestInFlight = false;

  readonly settings = this.loadSettings();

  startPolling(): void {
    if (this.pollingSubscription || !this.settings.pollingEnabled) {
      return;
    }

    this.refreshUnreadCount();

    this.pollingSubscription = interval(this.clampInterval(this.settings.pollingIntervalMs))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        exhaustMap(() => this.pollUnreadCount()),
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  refreshUnreadCount(): void {
    if (this.countRequestInFlight) {
      return;
    }

    this.countRequestInFlight = true;
    this.api
      .getCount()
      .pipe(
        tap((response) => this.store.setUnreadCount(response.unreadCount)),
        catchError(() => {
          return of(null);
        }),
        finalize(() => {
          this.countRequestInFlight = false;
        }),
      )
      .subscribe();
  }

  refreshDrawerPreview(): void {
    this.store.loadDrawerPreview();
  }

  updateSettings(settings: Partial<NotificationSettings>): void {
    const next = { ...this.loadSettings(), ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    this.stopPolling();
    if (next.pollingEnabled) {
      this.startPolling();
    }
  }

  getSettings(): NotificationSettings {
    return this.loadSettings();
  }

  private pollUnreadCount(): Observable<NotificationCountResponse | null> {
    if (this.countRequestInFlight) {
      return EMPTY;
    }

    this.countRequestInFlight = true;
    return this.api.getCount().pipe(
      tap((response) => this.store.setUnreadCount(response.unreadCount)),
      catchError(() => of(null)),
      finalize(() => {
        this.countRequestInFlight = false;
      }),
    );
  }

  private loadSettings(): NotificationSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS };
      }
      const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        pollingIntervalMs: this.clampInterval(
          parsed.pollingIntervalMs ?? DEFAULT_NOTIFICATION_SETTINGS.pollingIntervalMs,
        ),
      };
    } catch {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }
  }

  private clampInterval(value: number): number {
    return Math.min(POLLING_INTERVAL_MAX_MS, Math.max(POLLING_INTERVAL_MIN_MS, value));
  }
}

interface NotificationCountResponse {
  unreadCount: number;
}
