import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pagination',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <nav class="pagination" aria-label="Pagination">
      <button
        mat-icon-button
        type="button"
        [disabled]="pageNumber() <= 1"
        (click)="pageChange.emit(pageNumber() - 1)"
        aria-label="Previous page"
      >
        <mat-icon>chevron_left</mat-icon>
      </button>

      <span class="pagination__label">
        Page {{ pageNumber() }} of {{ totalPages() }}
      </span>

      <button
        mat-icon-button
        type="button"
        [disabled]="pageNumber() >= totalPages()"
        (click)="pageChange.emit(pageNumber() + 1)"
        aria-label="Next page"
      >
        <mat-icon>chevron_right</mat-icon>
      </button>
    </nav>
  `,
  styles: `
    .pagination {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pagination__label {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      min-width: 7rem;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly pageNumber = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalCount() / size));
  });
}
