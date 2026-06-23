import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-mention-chip',
  template: `
    <span class="mention-chip" role="link" tabindex="0">{{ label() }}</span>
  `,
  styles: `
    .mention-chip {
      display: inline-flex;
      padding: 0 0.375rem;
      border-radius: 0.375rem;
      background: color-mix(in srgb, var(--mat-sys-primary) 14%, transparent);
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionChipComponent {
  readonly label = input.required<string>();
}
