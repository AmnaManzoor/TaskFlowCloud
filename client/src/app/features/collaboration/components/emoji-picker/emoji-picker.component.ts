import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

const EMOJIS = ['👍', '👏', '🎉', '❤️', '🔥', '✅', '👀', '🚀', '💡', '🙌', '😄', '🤔'];

@Component({
  selector: 'app-emoji-picker',
  imports: [MatButtonModule],
  template: `
    @if (open()) {
      <div class="emoji-picker" role="listbox" aria-label="Emoji picker">
        @for (emoji of emojis; track emoji) {
          <button type="button" class="emoji-picker__item" (click)="pick.emit(emoji)">{{ emoji }}</button>
        }
      </div>
    }
  `,
  styles: `
    .emoji-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.5rem;
      border-radius: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
    }

    .emoji-picker__item {
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
      font-size: 1.125rem;
    }

    .emoji-picker__item:hover {
      background: var(--mat-sys-surface-container-high);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmojiPickerComponent {
  readonly open = input(false);
  readonly pick = output<string>();
  readonly emojis = EMOJIS;
}
