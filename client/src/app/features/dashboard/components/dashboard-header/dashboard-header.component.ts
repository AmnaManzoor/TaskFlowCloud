import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '@core/stores/auth.store';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-dashboard-header',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule],
  template: `
    <header class="dashboard-header u-animate-fade-in">
      <div class="dashboard-header__intro">
        <p class="dashboard-header__eyebrow">Welcome back</p>
        <h1 class="dashboard-header__title">{{ greeting() }}, {{ firstName() }}</h1>
        <p class="dashboard-header__subtitle">
          Here is an overview of your projects, tasks, and team activity.
        </p>
      </div>

      <div class="dashboard-header__actions">
        <mat-form-field class="dashboard-header__search" appearance="outline" subscriptSizing="dynamic">
          <mat-label>Search workspace</mat-label>
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input
            matInput
            type="search"
            placeholder="Search projects, tasks, people..."
            aria-label="Global search"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            (focus)="showHistory.set(true)"
            (blur)="hideHistoryDelayed()"
          />
          @if (showHistory()) {
            <div class="dashboard-header__history" role="listbox" aria-label="Recent searches">
              <p class="dashboard-header__history-title">Recent searches</p>
              @for (item of searchHistory; track item) {
                <button type="button" class="dashboard-header__history-item" role="option">
                  <mat-icon aria-hidden="true">history</mat-icon>
                  {{ item }}
                </button>
              }
              <p class="dashboard-header__history-note">Search integration coming soon</p>
            </div>
          }
        </mat-form-field>

        <button
          mat-icon-button
          type="button"
          aria-label="Refresh dashboard"
          [disabled]="store.loading() || store.refreshing()"
          (click)="store.refresh()"
        >
          <mat-icon [class.spin]="store.refreshing()">refresh</mat-icon>
        </button>

        <button mat-stroked-button type="button" [matMenuTriggerFor]="rangeMenu" aria-label="Date range filter">
          <mat-icon aria-hidden="true">date_range</mat-icon>
          {{ dateRangeLabel() }}
        </button>
        <mat-menu #rangeMenu="matMenu">
          @for (option of dateRangeOptions; track option.id) {
            <button mat-menu-item type="button" (click)="selectRange(option.id)">
              {{ option.label }}
            </button>
          }
        </mat-menu>
      </div>
    </header>
  `,
  styles: `
    .dashboard-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .dashboard-header__eyebrow {
      margin: 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .dashboard-header__title {
      margin: 0.25rem 0 0;
      font: var(--mat-sys-headline-medium);
      letter-spacing: -0.03em;
    }

    .dashboard-header__subtitle {
      margin: 0.5rem 0 0;
      max-width: 36rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }

    .dashboard-header__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1 1 20rem;
      justify-content: flex-end;
    }

    .dashboard-header__search {
      flex: 1 1 18rem;
      max-width: 28rem;
      position: relative;
    }

    .dashboard-header__history {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      right: 0;
      z-index: 10;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      box-shadow: 0 12px 32px rgb(15 23 42 / 12%);
    }

    .dashboard-header__history-title {
      margin: 0 0 0.5rem;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .dashboard-header__history-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font: inherit;
      color: inherit;
    }

    .dashboard-header__history-item:hover {
      background: var(--mat-sys-surface-container);
    }

    .dashboard-header__history-note {
      margin: 0.5rem 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .spin {
      animation: spin 900ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 959px) {
      .dashboard-header__actions {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly store = inject(DashboardStore);
  private readonly authStore = inject(AuthStore);

  readonly searchQuery = signal('');
  readonly showHistory = signal(false);
  readonly selectedRange = signal('all');

  readonly searchHistory = ['Sprint planning', 'API migration', 'Design review', 'Release checklist'];

  readonly dateRangeOptions = [
    { id: 'all', label: 'All time' },
    { id: 'week', label: 'Last 7 days' },
    { id: 'month', label: 'Last 30 days' },
    { id: 'quarter', label: 'Last 90 days' },
  ];

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 17) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }

  firstName(): string {
    return this.authStore.user()?.firstName ?? 'there';
  }

  dateRangeLabel(): string {
    return this.dateRangeOptions.find((option) => option.id === this.selectedRange())?.label ?? 'All time';
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  hideHistoryDelayed(): void {
    setTimeout(() => this.showHistory.set(false), 150);
  }

  selectRange(id: string): void {
    this.selectedRange.set(id);
    const now = new Date();
    let from: string | null = null;

    if (id === 'week') {
      from = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    } else if (id === 'month') {
      from = new Date(now.getTime() - 30 * 86_400_000).toISOString();
    } else if (id === 'quarter') {
      from = new Date(now.getTime() - 90 * 86_400_000).toISOString();
    }

    this.store.setDateRange({ from, to: id === 'all' ? null : now.toISOString() });
  }
}
