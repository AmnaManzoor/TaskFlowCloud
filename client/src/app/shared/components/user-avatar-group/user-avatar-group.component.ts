import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-avatar-group',
  imports: [UserAvatarComponent],
  template: `
    <div class="avatar-group" role="group" [attr.aria-label]="ariaLabel()">
      @for (member of visibleMembers(); track member.id) {
        <app-user-avatar
          class="avatar-group__item"
          [name]="member.name"
          [imageUrl]="member.imageUrl"
          [size]="size()"
        />
      }
      @if (overflowCount() > 0) {
        <span class="avatar-group__overflow" [style.width.px]="size()" [style.height.px]="size()">
          +{{ overflowCount() }}
        </span>
      }
    </div>
  `,
  styles: `
    .avatar-group {
      display: flex;
      align-items: center;
    }

    .avatar-group__item {
      margin-left: -0.375rem;
      border: 2px solid var(--mat-sys-surface);
      border-radius: 50%;
    }

    .avatar-group__item:first-child {
      margin-left: 0;
    }

    .avatar-group__overflow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: -0.375rem;
      border-radius: 50%;
      border: 2px solid var(--mat-sys-surface);
      background: var(--mat-sys-surface-container-high);
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarGroupComponent {
  readonly members = input<{ id: string; name: string; imageUrl?: string }[]>([]);
  readonly maxVisible = input(3);
  readonly size = input(28);
  readonly ariaLabel = input('Team members');

  visibleMembers() {
    return this.members().slice(0, this.maxVisible());
  }

  overflowCount() {
    return Math.max(0, this.members().length - this.maxVisible());
  }
}
