import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

export interface ReportTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => string | number;
}

@Component({
  selector: 'app-report-table',
  imports: [MatTableModule],
  template: `
  <div class="report-table" role="region" [attr.aria-label]="caption()">
    <table mat-table [dataSource]="rows()" class="report-table__grid">
      @for (column of columns(); track column.key) {
        <ng-container [matColumnDef]="column.key">
          <th mat-header-cell *matHeaderCellDef>{{ column.header }}</th>
          <td mat-cell *matCellDef="let row">{{ column.cell(row) }}</td>
        </ng-container>
      }
      <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
    </table>
  </div>
  `,
  styles: `
    .report-table { overflow: auto; border: 1px solid var(--mat-sys-outline-variant); border-radius: 0.75rem; }
    .report-table__grid { width: 100%; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportTableComponent<T extends object> {
  readonly rows = input<T[]>([]);
  readonly columns = input<ReportTableColumn<T>[]>([]);
  readonly caption = input('Report table');

  displayedColumns(): string[] {
    return this.columns().map((column) => column.key);
  }
}
