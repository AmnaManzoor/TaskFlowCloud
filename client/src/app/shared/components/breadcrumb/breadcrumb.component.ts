import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  route?: string | readonly unknown[];
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb__list">
        @for (item of items(); track item.label; let last = $last) {
          <li class="breadcrumb__item">
            @if (!last && item.route) {
              <a [routerLink]="item.route">{{ item.label }}</a>
            } @else {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
            @if (!last) {
              <mat-icon class="breadcrumb__separator" aria-hidden="true">chevron_right</mat-icon>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .breadcrumb__list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
      font: var(--mat-sys-body-medium);
    }

    .breadcrumb__item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .breadcrumb__item a {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }

    .breadcrumb__item a:hover {
      text-decoration: underline;
    }

    .breadcrumb__separator {
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  readonly items = input<BreadcrumbItem[]>([]);
}
