import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule],
  template: `
    <table mat-table [dataSource]="data()" class="data-table" role="table">
      @for (column of columns(); track column.key) {
        <ng-container [matColumnDef]="column.key">
          <th mat-header-cell *matHeaderCellDef scope="col">{{ column.label }}</th>
          <td mat-cell *matCellDef="let row">{{ row[column.key] }}</td>
        </ng-container>
      }

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  `,
  styles: `
    .data-table {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  readonly columns = input<{ key: string; label: string }[]>([]);
  readonly data = input<Record<string, unknown>[]>([]);

  protected get displayedColumns(): string[] {
    return this.columns().map((column) => column.key);
  }
}
