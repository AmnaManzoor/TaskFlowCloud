import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quick-action-button',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-stroked-button
      type="button"
      class="quick-action"
      [disabled]="disabled()"
      [attr.aria-label]="label()"
      (click)="actionClick.emit()"
    >
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <span>{{ label() }}</span>
    </button>
  `,
  styles: `
    .quick-action {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-start;
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      transition: transform 160ms ease, box-shadow 160ms ease;
    }

    .quick-action:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgb(15 23 42 / 8%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionButtonComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false);

  readonly actionClick = output<void>();
}
