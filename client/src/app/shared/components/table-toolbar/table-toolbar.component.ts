import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-table-toolbar',
  template: `
    <div class="table-toolbar">
      <div class="table-toolbar__start">
        <ng-content select="[toolbar-start]" />
      </div>
      <div class="table-toolbar__end">
        <ng-content select="[toolbar-end]" />
      </div>
    </div>
  `,
  styles: `
    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .table-toolbar__start,
    .table-toolbar__end {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableToolbarComponent {}
