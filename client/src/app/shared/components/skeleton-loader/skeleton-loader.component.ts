import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  template: `
    <div class="skeleton" [style.height.px]="height()" aria-hidden="true">
      @for (row of rowsArray; track row) {
        <div class="skeleton__line" [style.width.%]="widthPercent()"></div>
      }
    </div>
  `,
  styles: `
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .skeleton__line {
      height: 1rem;
      border-radius: 0.25rem;
      background: linear-gradient(
        90deg,
        var(--mat-sys-surface-container) 25%,
        var(--mat-sys-surface-container-high) 50%,
        var(--mat-sys-surface-container) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }

      100% {
        background-position: -200% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  readonly rows = input(3);
  readonly height = input<number | undefined>(undefined);
  readonly widthPercent = input(100);

  protected get rowsArray(): number[] {
    return Array.from({ length: Math.max(1, this.rows()) }, (_, index) => index);
  }
}
