import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-header',
  template: `
    <div class="section-header">
      <div>
        <h2 class="section-header__title">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="section-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      @if (actionLabel()) {
        <button mat-button type="button" (click)="actionClick.emit()">
          {{ actionLabel() }}
          <mat-icon iconPositionEnd aria-hidden="true">arrow_forward</mat-icon>
        </button>
      }
    </div>
  `,
  styles: `
    .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .section-header__title {
      margin: 0;
      font: var(--mat-sys-title-large);
      letter-spacing: -0.02em;
    }

    .section-header__subtitle {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly actionLabel = input<string | undefined>(undefined);
  readonly actionClick = output<void>();
}
