import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-avatar',
  imports: [MatIconModule],
  template: `
    @if (imageUrl()) {
      <img
        class="avatar avatar--image"
        [src]="imageUrl()"
        [alt]="altText()"
        [style.width.px]="size()"
        [style.height.px]="size()"
      />
    } @else {
      <span
        class="avatar avatar--initials"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [attr.aria-label]="altText()"
        role="img"
      >
        {{ initials() }}
      </span>
    }
  `,
  styles: `
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      font: var(--mat-sys-label-large);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .avatar--image {
      object-fit: cover;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  readonly name = input('');
  readonly imageUrl = input<string | undefined>(undefined);
  readonly size = input(40);

  readonly initials = computed(() => {
    const parts = this.name()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
  });

  readonly altText = computed(() => {
    const name = this.name().trim();
    return name ? `${name} avatar` : 'User avatar';
  });
}
