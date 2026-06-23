import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { MentionUserOption } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-mention-dropdown',
  imports: [MatButtonModule],
  template: `
    @if (visible() && options().length) {
      <ul class="mention-dropdown" role="listbox" aria-label="Mention suggestions">
        @for (user of options(); track user.id) {
          <li>
            <button type="button" class="mention-dropdown__item" role="option" (click)="select.emit(user)">
              <span class="mention-dropdown__name">{{ user.label }}</span>
              <span class="mention-dropdown__email">{{ user.email }}</span>
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .mention-dropdown {
      position: absolute;
      z-index: 10;
      left: 0;
      right: 0;
      top: 100%;
      margin: 0.25rem 0 0;
      padding: 0.25rem;
      list-style: none;
      border-radius: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
      max-height: 12rem;
      overflow: auto;
    }

    .mention-dropdown__item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }

    .mention-dropdown__item:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .mention-dropdown__name {
      font: var(--mat-sys-label-large);
    }

    .mention-dropdown__email {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionDropdownComponent {
  readonly visible = input(false);
  readonly options = input<MentionUserOption[]>([]);
  readonly select = output<MentionUserOption>();
}
