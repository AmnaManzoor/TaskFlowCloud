import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SearchBoxComponent } from '@shared/components/search-box/search-box.component';
import { TableToolbarComponent } from '@shared/components/table-toolbar/table-toolbar.component';

@Component({
  selector: 'app-search-toolbar',
  imports: [TableToolbarComponent, SearchBoxComponent, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <app-table-toolbar>
      <div toolbar-start class="search-toolbar__start">
        <app-search-box
          [value]="search()"
          (valueChange)="searchChange.emit($event)"
          [label]="searchLabel()"
          [placeholder]="searchPlaceholder()"
        />
        @if (showStatusFilter()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select [value]="statusFilter()" (valueChange)="statusFilterChange.emit($event)">
              <mat-option [value]="null">All</mat-option>
              <mat-option [value]="true">Active</mat-option>
              <mat-option [value]="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </div>
      <div toolbar-end>
        <ng-content select="[toolbar-actions]" />
      </div>
    </app-table-toolbar>
  `,
  styles: `
    .search-toolbar__start {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchToolbarComponent {
  readonly search = input('');
  readonly searchLabel = input('Search');
  readonly searchPlaceholder = input('Search...');
  readonly showStatusFilter = input(false);
  readonly statusFilter = input<boolean | null>(null);

  readonly searchChange = output<string>();
  readonly statusFilterChange = output<boolean | null>();
}
