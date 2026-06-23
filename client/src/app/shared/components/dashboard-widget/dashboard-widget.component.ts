import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-dashboard-widget',
  imports: [MatButtonModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent],
  template: `
    <section class="widget" [class.widget--collapsible]="collapsible()" [@.disabled]="true">
      <header class="widget__header">
        <div class="widget__heading">
          @if (icon()) {
            <mat-icon class="widget__icon" aria-hidden="true">{{ icon() }}</mat-icon>
          }
          <div>
            <h2 class="widget__title">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="widget__subtitle">{{ subtitle() }}</p>
            }
          </div>
        </div>
        <div class="widget__actions">
          @if (actionLabel()) {
            <button mat-button type="button" (click)="actionClick.emit()">{{ actionLabel() }}</button>
          }
          @if (collapsible()) {
            <button
              mat-icon-button
              type="button"
              [attr.aria-expanded]="!collapsed()"
              [attr.aria-label]="collapsed() ? 'Expand section' : 'Collapse section'"
              (click)="toggleCollapse.emit()"
            >
              <mat-icon>{{ collapsed() ? 'expand_more' : 'expand_less' }}</mat-icon>
            </button>
          }
        </div>
      </header>

      @if (!collapsed()) {
        <div class="widget__body">
          @if (loading()) {
            <app-skeleton-loader [rows]="skeletonRows()" />
          } @else if (error()) {
            <div class="widget__error" role="alert">
              <mat-icon aria-hidden="true">error_outline</mat-icon>
              <p>{{ error() }}</p>
              @if (retryLabel()) {
                <button mat-stroked-button type="button" (click)="retryClick.emit()">
                  {{ retryLabel() }}
                </button>
              }
            </div>
          } @else if (empty()) {
            <app-empty-state
              [icon]="emptyIcon()"
              [title]="emptyTitle() ?? 'No data yet'"
              [description]="emptyDescription()"
            />
          } @else {
            <ng-content />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .widget {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
      transition: box-shadow 180ms ease, transform 180ms ease;
    }

    .widget:hover {
      box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
    }

    .widget__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .widget__heading {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 0;
    }

    .widget__icon {
      color: var(--mat-sys-primary);
      margin-top: 0.125rem;
    }

    .widget__title {
      margin: 0;
      font: var(--mat-sys-title-medium);
      letter-spacing: -0.01em;
    }

    .widget__subtitle {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .widget__actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .widget__body {
      min-height: 0;
    }

    .widget__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      color: var(--mat-sys-error);
    }

    .widget__error p {
      margin: 0;
      color: var(--mat-sys-on-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly icon = input<string | undefined>(undefined);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input<string | undefined>(undefined);
  readonly emptyDescription = input<string | undefined>(undefined);
  readonly actionLabel = input<string | undefined>(undefined);
  readonly retryLabel = input('Retry');
  readonly skeletonRows = input(4);
  readonly collapsible = input(false);
  readonly collapsed = input(false);

  readonly actionClick = output<void>();
  readonly retryClick = output<void>();
  readonly toggleCollapse = output<void>();
}
