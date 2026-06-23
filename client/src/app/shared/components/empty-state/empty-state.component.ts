import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state" role="status">
      @if (icon()) {
        <mat-icon class="empty-state__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      }
      <h2 class="empty-state__title">{{ title() }}</h2>
      @if (description()) {
        <p class="empty-state__description">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button mat-flat-button type="button" (click)="actionClick.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-state__icon {
      width: 3rem;
      height: 3rem;
      font-size: 3rem;
      color: var(--mat-sys-outline);
    }

    .empty-state__title {
      margin: 0;
      font: var(--mat-sys-title-large);
    }

    .empty-state__description {
      margin: 0;
      max-width: 28rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly actionLabel = input<string | undefined>(undefined);

  readonly actionClick = output<void>();
}
